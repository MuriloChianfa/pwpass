package model

import "time"

type Secret struct {
	Token            string `dynamodbav:"token"`
	EncryptedContent string `dynamodbav:"encrypted_content"`
	PassphraseHash   string `dynamodbav:"passphrase_hash"`
	ExpiresAt        int64  `dynamodbav:"expires_at"`
	MaxViews         int    `dynamodbav:"max_views"`
	CurrentViews     int    `dynamodbav:"current_views"`
	AllowDeletion    bool   `dynamodbav:"allow_deletion"`
	CreatedAt        int64  `dynamodbav:"created_at"`
	TTL              int64  `dynamodbav:"ttl"`
}

type PushRequest struct {
	Content       string `json:"content"`
	Passphrase    string `json:"passphrase,omitempty"`
	ExpireDays    int    `json:"expire_days"`
	MaxViews      int    `json:"max_views"`
	AllowDeletion bool   `json:"allow_deletion"`
}

type PushResponse struct {
	Token string `json:"token"`
}

type MetaResponse struct {
	HasPassphrase bool `json:"has_passphrase"`
}

type ViewRequest struct {
	Passphrase string `json:"passphrase,omitempty"`
}

type ViewResponse struct {
	Content        string `json:"content"`
	RemainingViews int    `json:"remaining_views"`
	ExpiresAt      int64  `json:"expires_at"`
	AllowDeletion  bool   `json:"allow_deletion"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func (s *Secret) IsExpired() bool {
	return time.Now().Unix() > s.ExpiresAt
}

func (s *Secret) ViewsExhausted() bool {
	return s.CurrentViews >= s.MaxViews
}
