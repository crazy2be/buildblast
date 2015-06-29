package util

import (
	"crypto/rand"
	"encoding/hex"
)

func GenerateHashKey() (string, error) {
	hashKey := make([]byte, 64)
	_, err := rand.Read(hashKey)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(hashKey), nil
}
