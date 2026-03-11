package crypto

import (
	"context"
	"encoding/base64"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kms"
)

type KMSClient struct {
	client *kms.Client
	keyID  string
}

func NewKMSClient(cfg aws.Config, keyID string) *KMSClient {
	return &KMSClient{
		client: kms.NewFromConfig(cfg),
		keyID:  keyID,
	}
}

func (k *KMSClient) Encrypt(ctx context.Context, plaintext string) (string, error) {
	out, err := k.client.Encrypt(ctx, &kms.EncryptInput{
		KeyId:     &k.keyID,
		Plaintext: []byte(plaintext),
	})
	if err != nil {
		return "", fmt.Errorf("kms encrypt: %w", err)
	}
	return base64.StdEncoding.EncodeToString(out.CiphertextBlob), nil
}

func (k *KMSClient) Decrypt(ctx context.Context, cipherB64 string) (string, error) {
	blob, err := base64.StdEncoding.DecodeString(cipherB64)
	if err != nil {
		return "", fmt.Errorf("base64 decode: %w", err)
	}
	out, err := k.client.Decrypt(ctx, &kms.DecryptInput{
		CiphertextBlob: blob,
	})
	if err != nil {
		return "", fmt.Errorf("kms decrypt: %w", err)
	}
	return string(out.Plaintext), nil
}
