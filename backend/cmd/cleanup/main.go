package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"

	"github.com/murilo/pwpass/backend/internal/store"
)

var db *store.DynamoStore

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("load aws config: %v", err)
	}
	db = store.NewDynamoStore(cfg, os.Getenv("TABLE_NAME"))
}

func handler(ctx context.Context) error {
	deleted, err := db.DeleteExpired(ctx)
	if err != nil {
		log.Printf("cleanup error: %v", err)
		return err
	}
	log.Printf("cleanup complete: %d secrets deleted", deleted)
	return nil
}

func main() {
	lambda.Start(handler)
}
