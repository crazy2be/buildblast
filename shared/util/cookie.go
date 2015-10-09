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
	session *sessions.Session
	r       *http.Request
	w       http.ResponseWriter
}

var cookieStore *sessions.CookieStore

func NewCookieJar(w http.ResponseWriter, r *http.Request, config *ServerConfig) *CookieJar {
	cj := new(CookieJar)
	if cookieStore == nil {
		cookieStore = sessions.NewCookieStore(config.CookieKeyPairs...)
	}
	var err error
	cj.session, err = cookieStore.Get(r, SESSION_NAME)
	if err != nil {
		fmt.Println("Error reading session store:", err)
	}
	if cj.session.IsNew {
		cj.session.Options.Domain = config.CookieDomain
		cj.session.Options.MaxAge = 86400 * 7 // 1 Week
		cj.session.Options.HttpOnly = false
		cj.session.Options.Secure = config.CookieSecure
	}
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
	err := sessions.Save(cj.r, cj.w)
	if err != nil {
		fmt.Println("Error saving cookies:", err)
	}
}

func (cj CookieJar) getCookie(name string) string {
	sessionKey := cj.session.Values[name]
	if sessionKey == nil {
		return ""
	}
	return cj.session.Values[name].(string)
}

func (cj CookieJar) setCookie(name, value string) {
	cj.session.Values[name] = value
}

func (cj CookieJar) ParseFlashes() map[string]string {
	result := make(map[string]string)
	for _, flashKey := range FLASH_KEYS {
		value := cj.session.Flashes(flashKey)
		if value != nil {
			result[flashKey] = value[0].(string)
		}
	}
	return result
}

func (cj CookieJar) setFlash(key, value string) {
	cj.session.AddFlash(value, key)
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
