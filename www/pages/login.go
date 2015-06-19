package pages

import (
	"net/http"
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"buildblast/www/util"
)

type Login struct{}

type LoginForm struct {
	userOrEmail string
	Password    string
}

func (i Login) Process(c *Context, w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte("Can only login using POST"))
	}

	if c.authenticated {
		c.SaveSession()
		http.Redirect(w, r, "/", 303)
		return
	}

	userOrEmail := r.FormValue("userOrEmail")
	passwordPlain := r.FormValue("password")

	account, err := c.db.GetAccountByUsername(userOrEmail)
	if err != nil {
		account, err = c.db.GetAccountByEmail(userOrEmail)
	}

	if err != nil {
		c.SetIsInvalidLogin()
		c.SaveSession()
		http.Redirect(w, r, "/", 303)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(account.Password), []byte(passwordPlain))
	if err != nil {
		c.SetIsInvalidLogin()
		c.SaveSession()
		http.Redirect(w, r, "/", 303)
		return
	}

	keyString, err := util.GenerateHashKey()
	tx := c.db.BeginTransaction()
	c.db.CreateAccountSession(tx, keyString, account)
	c.db.CommitTransaction(tx)
	c.SetSessionKey(keyString)

	fmt.Printf("Login success for user %s!\n", account.Username)

	c.SaveSession()
	http.Redirect(w, r, "/", 303)
}
