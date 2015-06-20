package pages

import (
	"fmt"
	"net/http"
	"regexp"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type SignUp struct{}

type SignUpForm struct {
	User     string
	Email    string
	Password string
}

func (i SignUp) Process(c *Context, w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte("Can only register using POST"))
	}

	username := r.FormValue("username")
	email := r.FormValue("email")
	passwordPlain := r.FormValue("password")

	// Usernames can only be letters, numbers and spaces. Must be at least 3 runes
	invalid := false
	invalid = invalid || len([]rune(username)) < 3

	match, _ := regexp.MatchString("([a-zA-Z0-9]+)", username)
	invalid = invalid || !match

	if invalid {
		fmt.Println("Username not valid...")
	}

	match, _ = regexp.MatchString("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
		email)

	invalid = invalid || !match

	if invalid {
		fmt.Println("Email not valid...")
	}

	// Passwords must be at least 6 runes long
	invalid = invalid || len([]rune(passwordPlain)) < 6

	_, err := c.db.GetAccountByUsername(username)
	if err == nil {
		c.cj.SetUsernameTaken()
		invalid = true
	}

	_, err = c.db.GetAccountByEmail(email)
	if err == nil {
		c.cj.SetEmailTaken()
		invalid = true
	}

	if invalid {
		c.cj.SetSignupFormVals(username, email)
		c.Redirect("/", http.StatusSeeOther)
		return
	}

	start := time.Now()
	password, err := bcrypt.GenerateFromPassword([]byte(passwordPlain), 10)
	elapsed := time.Since(start)
	fmt.Println("BCrypt took:", elapsed)
	if err != nil {
		fmt.Println("Couldn't hash password...", err)
		c.Redirect("/", http.StatusSeeOther)
		return
	}

	tx := c.db.BeginTransaction()
	err = c.db.CreateAccount(tx, username, email, string(password))
	if err != nil {
		fmt.Println("Could not create account:", err)
		c.Redirect("/", http.StatusSeeOther)
		return
	}

	c.db.CommitTransaction(tx)
	err = c.SendConfirmationEmail(email)
	if err != nil {
		fmt.Println("Couldn't send confirmation email:", err)
	}
	c.Redirect("/", http.StatusSeeOther)
}
