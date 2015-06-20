package util

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"html/template"
	"net/smtp"

	"buildblast/shared/db"
	"buildblast/shared/util"
)

var emailTemplates = map[string]string{
	"confirmEmail": "templates/emails/confirmEmail.html",
}

var templates map[string]*template.Template

func init() {
	templates = make(map[string]*template.Template)
	util.ParseTemplates(templates, emailTemplates)
}

type Mailer struct {
	auth smtp.Auth
}

func NewMailer(mailPass string) *Mailer {
	m := new(Mailer)
	m.auth = smtp.PlainAuth(
		"",
		"mailer@buildblast.com",
		mailPass,
		"smtp.gmail.com",
	)

	return m
}

func createHeader(to string, subject string) string {
	header := map[string]string{
		"Return-Path":               "mailer.buildblast.com",
		"From":                      "mailer.buildblast.com",
		"To":                        to,
		"Subject":                   subject,
		"MIME-Version":              "1.0",
		"Content-Type":              "text/html; charset=\"utf-8\"",
		"Content-Transfer-Encoding": "base64",
	}

	result := ""
	for k, v := range header {
		result += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	result += "\r\n"
	return result
}

func (m Mailer) sendEmail(account db.Account, subject string, template string, templateVars map[string]interface{}) {
	body := new(bytes.Buffer)
	err := templates[template].Execute(body, templateVars)
	if err != nil {
		fmt.Println("Couldn't execute template:", err)
		return
	}
	message := createHeader(account.EmailAddress, subject)
	message += base64.StdEncoding.EncodeToString(body.Bytes())
	err = smtp.SendMail(
		"smtp.gmail.com:587",
		m.auth,
		"mailer@buildblast.com",
		[]string{account.EmailAddress},
		[]byte(message),
	)
	if err != nil {
		fmt.Println("Couldn't send email:", err)
	}
}

func (m Mailer) SendConfirmationEmail(account db.Account, key string) {
	m.sendEmail(account, "BuildBlast email confirmation", "confirmEmail", map[string]interface{}{
		"username":         account.Username,
		"confirmationLink": "https://www.buildblast.com/confirm-email/" + key,
	})
}
