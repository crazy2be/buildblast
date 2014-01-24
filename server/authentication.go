package main

import (
	"crypto/tls"
	"encoding/json"
	"errors"
	"net/http"

	"code.google.com/p/go.net/websocket"
)

type ApiUserResponse struct {
	Id        int `json:",string"`
	Email     string
	Name      string
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	Error     string
}

type AuthError struct {
	Message string
	Err     error
}

func (ae AuthError) Error() string {
	return "Authentication error: " + ae.Message + " " + ae.Err.Error()
}

func Authenticate(ws *websocket.Conn) (*ApiUserResponse, *AuthError) {
	// Read the seesion cookie
	cookie, err := ws.Request().Cookie("session_token")
	if err != nil {
		return nil, &AuthError{Message: "Not signed in.", Err: err}
	}

	// Submit the cookie to the auth server, for verification
	token := cookie.Value
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	cli := &http.Client{Transport: tr}
	req, err := http.NewRequest("GET", "https://www.buildblast.com/api/users/"+token, nil)
	if err != nil {
		return nil, &AuthError{Message: "Invalid token", Err: err}
	}
	req.SetBasicAuth("name", "password")
	res, err := cli.Do(req)
	if err != nil {
		return nil, &AuthError{Message: "Auth server connection issue.", Err: err}
	}

	var data ApiUserResponse
	err = json.NewDecoder(res.Body).Decode(&data)
	if err != nil {
		return nil, &AuthError{Message: "Could not parse auth response.", Err: err}
	}

	// Determine if we successfully logged in
	if data.Error != "" {
		return nil, &AuthError{Message: "Not signed in.", Err: errors.New("Server did not verify token")}
	}

	return &data, nil
}
