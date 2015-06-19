package pages

import (
	"net/http"
)

type Logout struct{}

func (i Logout) Process(c *Context, w http.ResponseWriter, r *http.Request) {
	tx := c.db.BeginTransaction()
	c.db.DeleteAccountSession(tx, c.accountSession.Key)
	c.db.CommitTransaction(tx)
	c.ClearSessionKey()
	c.SaveSession()
	http.Redirect(w, r, "/", 303)
}
