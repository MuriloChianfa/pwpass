package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"golang.org/x/crypto/bcrypt"

	"github.com/murilo/pwpass/backend/internal/crypto"
	"github.com/murilo/pwpass/backend/internal/model"
	"github.com/murilo/pwpass/backend/internal/store"
	tokenpkg "github.com/murilo/pwpass/backend/internal/token"
)

var (
	db  *store.DynamoStore
	kms *crypto.KMSClient
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("load aws config: %v", err)
	}
	db = store.NewDynamoStore(cfg, os.Getenv("TABLE_NAME"))
	kms = crypto.NewKMSClient(cfg, os.Getenv("KMS_KEY_ID"))
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	method := req.RequestContext.HTTP.Method
	path := req.RequestContext.HTTP.Path

	switch {
	case method == http.MethodPost && path == "/secrets":
		return handlePush(ctx, req)
	case method == http.MethodGet && strings.HasSuffix(path, "/meta"):
		return handleMeta(ctx, req)
	case method == http.MethodPost && strings.HasSuffix(path, "/view"):
		return handleView(ctx, req)
	case method == http.MethodDelete && strings.HasPrefix(path, "/secrets/"):
		return handleDelete(ctx, req)
	default:
		return jsonResponse(http.StatusNotFound, model.ErrorResponse{Error: "not found"})
	}
}

const (
	maxContentLen  = 10_000
	maxExpireDays  = 30
	maxViews       = 100
	maxBodySize    = 12_000
)

func handlePush(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	if len(req.Body) > maxBodySize {
		return jsonResponse(http.StatusRequestEntityTooLarge, model.ErrorResponse{Error: "request body too large"})
	}

	var body model.PushRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return jsonResponse(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request body"})
	}
	if body.Content == "" || body.ExpireDays < 1 || body.MaxViews < 1 {
		return jsonResponse(http.StatusBadRequest, model.ErrorResponse{Error: "content, expire_days (>=1), and max_views (>=1) are required"})
	}
	if len(body.Content) > maxContentLen {
		return jsonResponse(http.StatusRequestEntityTooLarge, model.ErrorResponse{Error: "content exceeds 10 000 characters"})
	}
	if body.ExpireDays > maxExpireDays {
		body.ExpireDays = maxExpireDays
	}
	if body.MaxViews > maxViews {
		body.MaxViews = maxViews
	}

	encrypted, err := kms.Encrypt(ctx, body.Content)
	if err != nil {
		log.Printf("encrypt error: %v", err)
		return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "encryption failed"})
	}

	var passphraseHash string
	if body.Passphrase != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(body.Passphrase), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("bcrypt error: %v", err)
			return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "internal error"})
		}
		passphraseHash = string(hash)
	}

	token, err := tokenpkg.Generate()
	if err != nil {
		log.Printf("token error: %v", err)
		return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "internal error"})
	}
	expiresAt := time.Now().Unix() + int64(body.ExpireDays)*86400

	secret := &model.Secret{
		Token:            token,
		EncryptedContent: encrypted,
		PassphraseHash:   passphraseHash,
		ExpiresAt:        expiresAt,
		MaxViews:         body.MaxViews,
		CurrentViews:     0,
		AllowDeletion:    body.AllowDeletion,
		CreatedAt:        time.Now().Unix(),
		TTL:              expiresAt,
	}

	if err := db.Put(ctx, secret); err != nil {
		log.Printf("put error: %v", err)
		return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "failed to store secret"})
	}

	return jsonResponse(http.StatusCreated, model.PushResponse{Token: token})
}

func handleMeta(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	token := extractToken(req.RequestContext.HTTP.Path)
	if token == "" {
		return jsonResponse(http.StatusBadRequest, model.ErrorResponse{Error: "missing token"})
	}

	secret, err := db.Get(ctx, token)
	if err != nil {
		log.Printf("get error: %v", err)
		return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "internal error"})
	}
	if secret == nil || secret.IsExpired() || secret.ViewsExhausted() {
		return jsonResponse(http.StatusNotFound, model.ErrorResponse{Error: "secret not found"})
	}

	return jsonResponse(http.StatusOK, model.MetaResponse{
		HasPassphrase: secret.PassphraseHash != "",
	})
}

func handleView(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	token := extractToken(req.RequestContext.HTTP.Path)
	if token == "" {
		return jsonResponse(http.StatusBadRequest, model.ErrorResponse{Error: "missing token"})
	}

	secret, err := db.Get(ctx, token)
	if err != nil {
		log.Printf("get error: %v", err)
		return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "internal error"})
	}
	if secret == nil || secret.IsExpired() || secret.ViewsExhausted() {
		if secret != nil {
			if err := db.Delete(ctx, token); err != nil {
				log.Printf("failed to delete stale secret %s: %v", token, err)
			}
		}
		return jsonResponse(http.StatusNotFound, model.ErrorResponse{Error: "secret not found or expired"})
	}

	if secret.PassphraseHash != "" {
		var body model.ViewRequest
		_ = json.Unmarshal([]byte(req.Body), &body)
		if err := bcrypt.CompareHashAndPassword([]byte(secret.PassphraseHash), []byte(body.Passphrase)); err != nil {
			return jsonResponse(http.StatusForbidden, model.ErrorResponse{Error: "invalid passphrase"})
		}
	}

	updated, err := db.IncrementViews(ctx, token)
	if err != nil {
		return jsonResponse(http.StatusConflict, model.ErrorResponse{Error: "secret no longer available"})
	}

	plaintext, err := kms.Decrypt(ctx, updated.EncryptedContent)
	if err != nil {
		log.Printf("decrypt error: %v", err)
		return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "decryption failed"})
	}

	remaining := updated.MaxViews - updated.CurrentViews
	if remaining <= 0 {
		if err := db.Delete(ctx, token); err != nil {
			log.Printf("failed to delete exhausted secret %s: %v", token, err)
		}
	}

	return jsonResponse(http.StatusOK, model.ViewResponse{
		Content:        plaintext,
		RemainingViews: remaining,
		ExpiresAt:      updated.ExpiresAt,
		AllowDeletion:  updated.AllowDeletion,
	})
}

func handleDelete(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	token := extractToken(req.RequestContext.HTTP.Path)
	if token == "" {
		return jsonResponse(http.StatusBadRequest, model.ErrorResponse{Error: "missing token"})
	}

	secret, err := db.Get(ctx, token)
	if err != nil {
		log.Printf("get error: %v", err)
		return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "internal error"})
	}
	if secret == nil {
		return jsonResponse(http.StatusNotFound, model.ErrorResponse{Error: "secret not found"})
	}
	if !secret.AllowDeletion {
		return jsonResponse(http.StatusForbidden, model.ErrorResponse{Error: "deletion not allowed for this secret"})
	}

	if err := db.Delete(ctx, token); err != nil {
		log.Printf("delete error: %v", err)
		return jsonResponse(http.StatusInternalServerError, model.ErrorResponse{Error: "failed to delete"})
	}

	return events.APIGatewayV2HTTPResponse{StatusCode: http.StatusNoContent}, nil
}

// extractToken pulls the token segment from paths like /secrets/{token}/meta or /secrets/{token}
func extractToken(path string) string {
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	if len(parts) >= 2 && parts[0] == "secrets" {
		return parts[1]
	}
	return ""
}

func jsonResponse(status int, body any) (events.APIGatewayV2HTTPResponse, error) {
	b, _ := json.Marshal(body)
	return events.APIGatewayV2HTTPResponse{
		StatusCode: status,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(b),
	}, nil
}

func main() {
	lambda.Start(handler)
}
