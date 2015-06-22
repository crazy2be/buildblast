package pages

import (
	"net/http"

	"github.com/gorilla/mux"
)

type ConfirmEmail struct{}

func (i ConfirmEmail) Process(c *Context, w http.ResponseWriter, r *http.Request) {
	confirmationKey, ok := mux.Vars(r)["hashKey"]
	if !ok {
		c.Redirect("/", http.StatusSeeOther)
		return
	}
	emailConfirmation, err := c.db.GetEmailConfirmation(confirmationKey)
	if err != nil {
		c.Redirect("/", http.StatusSeeOther)
		return
	}
	account, err := c.db.GetAccount(emailConfirmation.AccountId)
	if err != nil {
		c.Redirect("/", http.StatusSeeOther)
		return
	}
	tx := c.db.BeginTransaction()
	err = c.db.UpdateAccountEmailConfirmed(tx, account)
	if err != nil {
		tx.Rollback()
		c.Redirect("/", http.StatusSeeOther)
		return
	}
	err = c.db.DeleteEmailConfirmation(tx, account)
	if err != nil {
		tx.Rollback()
		c.Redirect("/", http.StatusSeeOther)
		return
	}
	c.db.CommitTransaction(tx)
	c.cj.SetEmailConfirmed()
	c.Redirect("/", http.StatusSeeOther)
}
