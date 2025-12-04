package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
)

// MicrosoftUserInfo represents user information from Microsoft Graph API
type MicrosoftUserInfo struct {
	ID                string `json:"id"`
	DisplayName       string `json:"displayName"`
	GivenName         string `json:"givenName"`
	Surname           string `json:"surname"`
	UserPrincipalName string `json:"userPrincipalName"`
	Mail              string `json:"mail"`
}

// ValidateMicrosoftToken validates the Microsoft access token and returns user information
func ValidateMicrosoftToken(accessToken string) (*MicrosoftUserInfo, error) {
	// Microsoft Graph API endpoint
	url := "https://graph.microsoft.com/v1.0/me"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call Microsoft Graph API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("microsoft API returned status %d: %s", resp.StatusCode, string(body))
	}

	var userInfo MicrosoftUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Validate that we got essential information
	if userInfo.Mail == "" && userInfo.UserPrincipalName == "" {
		return nil, errors.New("no email found in Microsoft account")
	}

	// Use Mail if available, otherwise UserPrincipalName
	if userInfo.Mail == "" {
		userInfo.Mail = userInfo.UserPrincipalName
	}

	return &userInfo, nil
}

// GetMicrosoftClientID returns the Microsoft OAuth client ID from environment
func GetMicrosoftClientID() string {
	return os.Getenv("MICROSOFT_CLIENT_ID")
}

// GetMicrosoftTenantID returns the Microsoft tenant ID from environment
func GetMicrosoftTenantID() string {
	tenantID := os.Getenv("MICROSOFT_TENANT_ID")
	if tenantID == "" {
		return "common" // Allows personal and organizational accounts
	}
	return tenantID
}
