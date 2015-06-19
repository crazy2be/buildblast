package pages

import (
	"html/template"
	"net/http"
	"time"
	"fmt"
	"log"

	"github.com/gorilla/sessions"

	"buildblast/www/database"
	"buildblast/www/util"
)

var templates map[string]*template.Template

var templatePaths = map[string]string {
	"header": "templates/components/header.html",
	"footer": "templates/components/footer.html",
	"index": "templates/index.html",
}

var flashKeys = []string {
	"invalid_login",
	"username_taken",
	"email_taken",
	"signup_username",
	"signup_email",
	"show_login",
	"show_signup",
}

func init() {
	templates = make(map[string]*template.Template)
	util.ParseTemplates(templates, templatePaths)
}

type Context struct {
	db             *database.Database
	cookieStore    *sessions.CookieStore
	mailer         *util.Mailer
	pageVals       map[string]interface{} // Map passed to all templates for rendering
	w              http.ResponseWriter
	r              *http.Request
	authenticated  bool
	accountSession database.AccountSession
	account        database.Account
}

func NewContext(db *database.Database, cookieStore *sessions.CookieStore, mailer *util.Mailer,
	w http.ResponseWriter, r *http.Request) *Context {

	c := new(Context)
	c.db = db
	c.cookieStore = cookieStore
	c.mailer = mailer
	c.pageVals = make(map[string]interface{})
	c.w = w
	c.r = r
	return c
}

func (c *Context) Authenticate() {
	c.authenticated = false

	sessionKey := c.GetSessionKey()
	accountSession, err := c.db.GetAccountSession(sessionKey)
	if err != nil {
		// Session not valid. Remove it.
		c.ClearSessionKey()
		return
	}

	if accountSession.LoginTime.Before(time.Now().Add(-time.Hour * 24 * 7)) {
		// Session expires every 7 days
		tx := c.db.BeginTransaction()
		err = c.db.DeleteAccountSession(tx, sessionKey)
		if err != nil {
			fmt.Println("Couldn't delete account session")
		}
		c.db.CommitTransaction(tx)
		c.ClearSessionKey()
		return
	}

	// Valid login.
	c.accountSession = accountSession
	c.account, err = c.db.GetAccount(c.accountSession.AccountId)
	if err != nil {
		fmt.Println("Couldn't find account for account session. Something is wrong.", err)
		c.ClearSessionKey()
		return
	}

	c.authenticated = true
	c.pageVals["authenticated"] = true
	c.pageVals["username"] = c.account.Username
}

func (c *Context) SetSessionKey(key string) {
	session, _ := c.cookieStore.Get(c.r, "default-session")
	session.Values["sessionKey"] = key
}

func (c *Context) ClearSessionKey() {
	session, _ := c.cookieStore.Get(c.r, "default-session")
	session.Values["sessionKey"] = ""
}

func (c *Context) GetSessionKey() string {
	session, _ := c.cookieStore.Get(c.r, "default-session")
	sessionKey := session.Values["sessionKey"]
	if sessionKey == nil {
		return ""
	}
	return session.Values["sessionKey"].(string)
}

func (c *Context) SetIsInvalidLogin() {
	session, _ := c.cookieStore.Get(c.r, "default-session")
	session.AddFlash("true", "invalid_login")
	session.AddFlash("true", "show_login")
}

func (c *Context) SetUsernameTaken() {
	session, _ := c.cookieStore.Get(c.r, "default-session")
	session.AddFlash("true", "username_taken")
	session.AddFlash("true", "show_signup")
}

func (c *Context) SetEmailTaken() {
	session, _ := c.cookieStore.Get(c.r, "default-session")
	session.AddFlash("true", "email_taken")
	session.AddFlash("true", "show_signup")
}

func (c *Context) SetSignupFormVals(username string, email string) {
	session, _ := c.cookieStore.Get(c.r, "default-session")
	session.AddFlash(username, "signup_username")
	session.AddFlash(email, "signup_email")
}

func (c *Context) ParseFlashes() {
	session, _ := c.cookieStore.Get(c.r, "default-session")
	for _, flashKey := range flashKeys {
		value := session.Flashes(flashKey)
		if value != nil {
			c.pageVals[flashKey] = value[0]
		}
	}
}

// This should be called before writing the response, as it needs to set the cookies in the header.
func (c *Context) SaveSession() {
	sessions.Save(c.r, c.w)
}

func (c *Context) SendConfirmationEmail(email string) error {
	account, err := c.db.GetAccountByEmail(email)
	if err != nil {
		return err
	}

	keyString, err := util.GenerateHashKey()
	if err != nil {
		return err
	}

	tx := c.db.BeginTransaction()
	c.db.CreateEmailConfirmation(tx, keyString, account)
	c.db.CommitTransaction(tx)

	go c.mailer.SendConfirmationEmail(account, keyString)
	return nil
}

type Processor interface {
	Process(c *Context, w http.ResponseWriter, r *http.Request)
}

func templateExecuteErr(err error) {
	if err != nil {
		log.Fatal("Executing template:", err)
	}
}
