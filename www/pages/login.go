package pages

import (
	"fmt"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"buildblast/shared/util"
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
		c.Redirect("/", http.StatusSeeOther)
		return
	}

	userOrEmail := r.FormValue("userOrEmail")
	passwordPlain := r.FormValue("password")

	account, err := c.db.GetAccountByUsername(userOrEmail)
	if err != nil {
		account, err = c.db.GetAccountByEmail(userOrEmail)
	}

	if err != nil {
		c.cj.SetIsInvalidLogin()
		c.Redirect("/", http.StatusSeeOther)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(account.Password), []byte(passwordPlain))
	if err != nil {
		c.cj.SetIsInvalidLogin()
		c.Redirect("/", http.StatusSeeOther)
		return
	}

	keyString, err := util.GenerateHashKey()
	tx := c.db.BeginTransaction()
	c.db.CreateAccountSession(tx, keyString, account)
	c.db.CommitTransaction(tx)
	c.cj.SetSessionKey(keyString)

	fmt.Printf("Login success for user %s!\n", account.Username)
	c.Redirect("/", http.StatusSeeOther)
}
