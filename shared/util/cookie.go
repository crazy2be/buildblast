package util

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/sessions"

	"buildblast/shared/db"
)

const (
	SESSION_NAME = "default-session"
)

var FLASH_KEYS = []string{
	"invalid_login",
	"username_taken",
	"email_taken",
	"signup_username",
	"signup_email",
	"show_login",
	"show_signup",
	"email_confirmed",
}

type CookieJar struct {
	cookieStore *sessions.CookieStore
	r           *http.Request
	w           http.ResponseWriter
}

func NewCookieJar(w http.ResponseWriter, r *http.Request, keypairs ...[]byte) *CookieJar {
	cj := new(CookieJar)
	cj.cookieStore = sessions.NewCookieStore(keypairs...)
	cj.w = w
	cj.r = r
	return cj
}

func (cj *CookieJar) Authenticate(dbc *db.Database) (db.Account, db.AccountSession, bool) {
	emptyAccount := db.Account{}
	emptySession := db.AccountSession{}
	sessionKey := cj.GetSessionKey()
	accountSession, err := dbc.GetAccountSession(sessionKey)
	if err != nil {
		// Session not valid. Remove it.
		cj.ClearSessionKey()
		return emptyAccount, emptySession, false
	}

	if accountSession.LoginTime.Before(time.Now().Add(-time.Hour * 24 * 7)) {
		// Session expires every 7 days
		tx := dbc.BeginTransaction()
		err = dbc.DeleteAccountSession(tx, sessionKey)
		if err != nil {
			fmt.Println("Couldn't delete account session")
		}
		dbc.CommitTransaction(tx)
		cj.ClearSessionKey()
		return emptyAccount, emptySession, false
	}

	// Valid login.
	account, err := dbc.GetAccount(accountSession.AccountId)
	if err != nil {
		fmt.Println("Couldn't find account for account session. Something is wrong.", err)
		cj.ClearSessionKey()
		return emptyAccount, emptySession, false
	}

	return account, accountSession, true
}

// This should be called before writing the response, as it needs to set the cookies in the header.
func (cj *CookieJar) SaveSession() {
	sessions.Save(cj.r, cj.w)
}

func (cj CookieJar) getCookie(name string) string {
	session, _ := cj.cookieStore.Get(cj.r, SESSION_NAME)
	sessionKey := session.Values[name]
	if sessionKey == nil {
		return ""
	}
	return session.Values[name].(string)
}

func (cj CookieJar) setCookie(name, value string) {
	session, _ := cj.cookieStore.Get(cj.r, SESSION_NAME)
	session.Values[name] = value
}

func (cj CookieJar) ParseFlashes() map[string]string {
	session, _ := cj.cookieStore.Get(cj.r, SESSION_NAME)
	result := make(map[string]string)
	for _, flashKey := range FLASH_KEYS {
		value := session.Flashes(flashKey)
		if value != nil {
			result[flashKey] = value[0].(string)
		}
	}
	return result
}

func (cj CookieJar) setFlash(key, value string) {
	session, _ := cj.cookieStore.Get(cj.r, SESSION_NAME)
	session.AddFlash(value, key)
}

func (cj CookieJar) setBoolFlash(key string) {
	cj.setFlash(key, "true")
}

func (cj CookieJar) ClearCookie(name string) {
	cj.setCookie(name, "")
}

func (cj CookieJar) SetSessionKey(key string) {
	cj.setCookie("sessionKey", key)
}

func (cj CookieJar) ClearSessionKey() {
	cj.ClearCookie("sessionKey")
}

func (cj CookieJar) GetSessionKey() string {
	return cj.getCookie("sessionKey")
}

func (cj CookieJar) SetIsInvalidLogin() {
	cj.setBoolFlash("invalid_login")
	cj.setBoolFlash("show_login")
}

func (cj CookieJar) SetUsernameTaken() {
	cj.setBoolFlash("username_taken")
	cj.setBoolFlash("show_signup")
}

func (cj CookieJar) SetEmailTaken() {
	cj.setBoolFlash("email_taken")
	cj.setBoolFlash("show_signup")
}

func (cj CookieJar) SetEmailConfirmed() {
	cj.setBoolFlash("email_confirmed")
}

func (cj CookieJar) SetSignupFormVals(username string, email string) {
	cj.setFlash("signup_username", username)
	cj.setFlash("signup_email", email)
}
