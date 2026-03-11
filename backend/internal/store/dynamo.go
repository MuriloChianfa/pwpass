package store

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/murilo/pwpass/backend/internal/model"
)

type DynamoStore struct {
	client    *dynamodb.Client
	tableName string
}

func NewDynamoStore(cfg aws.Config, tableName string) *DynamoStore {
	return &DynamoStore{
		client:    dynamodb.NewFromConfig(cfg),
		tableName: tableName,
	}
}

func (d *DynamoStore) Put(ctx context.Context, s *model.Secret) error {
	item, err := attributevalue.MarshalMap(s)
	if err != nil {
		return fmt.Errorf("marshal secret: %w", err)
	}
	_, err = d.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &d.tableName,
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("put item: %w", err)
	}
	return nil
}

func (d *DynamoStore) Get(ctx context.Context, token string) (*model.Secret, error) {
	out, err := d.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &d.tableName,
		Key: map[string]types.AttributeValue{
			"token": &types.AttributeValueMemberS{Value: token},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("get item: %w", err)
	}
	if out.Item == nil {
		return nil, nil
	}
	var s model.Secret
	if err := attributevalue.UnmarshalMap(out.Item, &s); err != nil {
		return nil, fmt.Errorf("unmarshal secret: %w", err)
	}
	return &s, nil
}

// IncrementViews atomically increments current_views if current_views < max_views.
// Returns the updated secret or an error if the condition fails (views exhausted).
func (d *DynamoStore) IncrementViews(ctx context.Context, token string) (*model.Secret, error) {
	update := expression.Set(
		expression.Name("current_views"),
		expression.Name("current_views").Plus(expression.Value(1)),
	)
	cond := expression.Name("current_views").LessThan(expression.Name("max_views"))

	expr, err := expression.NewBuilder().WithUpdate(update).WithCondition(cond).Build()
	if err != nil {
		return nil, fmt.Errorf("build expression: %w", err)
	}

	out, err := d.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: &d.tableName,
		Key: map[string]types.AttributeValue{
			"token": &types.AttributeValueMemberS{Value: token},
		},
		UpdateExpression:          expr.Update(),
		ConditionExpression:       expr.Condition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		ReturnValues:              types.ReturnValueAllNew,
	})
	if err != nil {
		return nil, fmt.Errorf("update item: %w", err)
	}

	var s model.Secret
	if err := attributevalue.UnmarshalMap(out.Attributes, &s); err != nil {
		return nil, fmt.Errorf("unmarshal updated secret: %w", err)
	}
	return &s, nil
}

func (d *DynamoStore) Delete(ctx context.Context, token string) error {
	_, err := d.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: &d.tableName,
		Key: map[string]types.AttributeValue{
			"token": &types.AttributeValueMemberS{Value: token},
		},
	})
	if err != nil {
		return fmt.Errorf("delete item: %w", err)
	}
	return nil
}

// DeleteExpired scans for all items past their expires_at and deletes them.
// Returns the count of deleted items.
func (d *DynamoStore) DeleteExpired(ctx context.Context) (int, error) {
	now := time.Now().Unix()

	filt := expression.Name("expires_at").LessThanEqual(expression.Value(now))
	proj := expression.NamesList(expression.Name("token"))
	expr, err := expression.NewBuilder().WithFilter(filt).WithProjection(proj).Build()
	if err != nil {
		return 0, fmt.Errorf("build expression: %w", err)
	}

	var deleted int
	var lastKey map[string]types.AttributeValue

	for {
		input := &dynamodb.ScanInput{
			TableName:                 &d.tableName,
			FilterExpression:          expr.Filter(),
			ProjectionExpression:      expr.Projection(),
			ExpressionAttributeNames:  expr.Names(),
			ExpressionAttributeValues: expr.Values(),
			ExclusiveStartKey:         lastKey,
		}

		out, err := d.client.Scan(ctx, input)
		if err != nil {
			return deleted, fmt.Errorf("scan: %w", err)
		}

		for _, item := range out.Items {
			token, ok := item["token"].(*types.AttributeValueMemberS)
			if !ok {
				continue
			}
			if err := d.Delete(ctx, token.Value); err != nil {
				return deleted, fmt.Errorf("delete %s: %w", token.Value, err)
			}
			deleted++
		}

		if out.LastEvaluatedKey == nil {
			break
		}
		lastKey = out.LastEvaluatedKey
	}
	return deleted, nil
}
