package pages

import (
	"html/template"
	"log"
	"net/http"

	"buildblast/shared/db"
	sutil "buildblast/shared/util"
	"buildblast/www/util"
)

var templates map[string]*template.Template

var templatePaths = map[string]string{
	"header": "templates/components/header.html",
	"footer": "templates/components/footer.html",
	"index":  "templates/index.html",
}

func init() {
	templates = make(map[string]*template.Template)
	sutil.ParseTemplates(templates, templatePaths)
}

type Context struct {
	db             *db.Database
	cj             *sutil.CookieJar
	mailer         *util.Mailer
	pageVals       map[string]interface{} // Map passed to all templates for rendering
	authenticated  bool
	account        db.Account
	accountSession db.AccountSession
	w              http.ResponseWriter
	r              *http.Request
}

func NewContext(db *db.Database, cj *sutil.CookieJar, mailer *util.Mailer,
	w http.ResponseWriter, r *http.Request) *Context {

	c := new(Context)
	c.db = db
	c.cj = cj
	c.mailer = mailer
	c.pageVals = make(map[string]interface{})
	c.w = w
	c.r = r
	return c
}

func (c *Context) Redirect(path string, status int) {
	c.cj.SaveSession()
	http.Redirect(c.w, c.r, path, status)
}

func (c *Context) Authenticate() {
	c.account, c.accountSession, c.authenticated = c.cj.Authenticate(c.db)
	if c.authenticated {
		c.pageVals["authenticated"] = true
		c.pageVals["username"] = c.account.Username
	}
}

func (c *Context) SendConfirmationEmail(email string) error {
	account, err := c.db.GetAccountByEmail(email)
	if err != nil {
		return err
	}

	keyString, err := sutil.GenerateHashKey()
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
