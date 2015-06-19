package database

import (
	"time"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type Database struct {
	connection *sqlx.DB
}

func NewDatabase(password string) *Database {
	var err error
	db := new(Database)
	db.connection, err = sqlx.Connect("postgres",
		"user=buildblast "+
			"dbname=buildblast "+
			"password="+password+" "+
			"port=5566 "+
			"sslmode=disable")
	if err != nil {
		log.Fatal("Could not connect to database", err)
	}
	return db
}

func (db Database) BeginTransaction() *sqlx.Tx {
	tx, err := db.connection.Beginx()
	if err != nil {
		log.Fatalln("Could not create database transaction.")
	}
	return tx
}

func (db Database) CommitTransaction(tx *sqlx.Tx) {
	err := tx.Commit()
	if err != nil {
		log.Fatalln("Could not commit database transaction.")
	}
}

type SystemConfig struct {
	Id         int
	CreatedAt  time.Time `db:"created_at"`
	ModifiedAt time.Time `db:"modified_at"`
}

func (db Database) GetSystemConfig() SystemConfig {
	systemConfig := SystemConfig{}
	db.connection.Get(&systemConfig, "SELECT * FROM system_config")
	return systemConfig
}

type Account struct {
	Id             int64
	CreatedAt      time.Time `db:"created_at"`
	Username       string
	EmailAddress   string `db:"email_address"`
	Password       string
	EmailConfirmed bool `db:"email_confirmed"`
}

func (db Database) GetAccount(id int64) (Account, error) {
	account := Account{}
	err := db.connection.Get(&account, "SELECT * FROM account WHERE id=$1", id)
	return account, err
}

func (db Database) GetAccountByUsername(username string) (Account, error) {
	account := Account{}
	err := db.connection.Get(&account, "SELECT * FROM account WHERE username=$1", username)
	return account, err
}

func (db Database) GetAccountByEmail(email string) (Account, error) {
	account := Account{}
	err := db.connection.Get(&account, "SELECT * FROM account WHERE email_address=$1", email)
	return account, err
}

func (db Database) CreateAccount(tx *sqlx.Tx, username string, email string, password string) error {
	_, err := tx.NamedExec("INSERT INTO account (username, email_address, password) "+
		"VALUES (:username, :email_address, :password)",
		&Account{Username: username, EmailAddress: email, Password: password})
	return err
}

type AccountSession struct {
	Key        string
	AccountId  int64     `db:"account_id"`
	LoginTime  time.Time `db:"login_time"`
	LastSeenAt time.Time `db:"last_seen_at"`
}

func (db Database) GetAccountSession(key string) (AccountSession, error) {
	accountSession := AccountSession{}
	err := db.connection.Get(&accountSession, "SELECT * FROM account_session WHERE key=$1", key)
	return accountSession, err
}

func (db Database) CreateAccountSession(tx *sqlx.Tx, key string, account Account) error {
	_, err := tx.NamedExec("INSERT INTO account_session (key, account_id) "+
		"VALUES (:key, :account_id)",
		&AccountSession{Key: key, AccountId: account.Id})
	return err
}

func (db Database) DeleteAccountSession(tx *sqlx.Tx, key string) error {
	stmt, err := tx.Preparex("DELETE FROM account_session WHERE key=$1")
	if err != nil {
		return err
	}
	_, err = stmt.Exec(key)
	return err
}

type EmailConfirmation struct {
	Key       string
	AccountId int64     `db:"account_id"`
	CreatedAt time.Time `db:"created_at"`
}

func (db Database) GetEmailConfirmation(key string) (EmailConfirmation, error) {
	emailConfirmation := EmailConfirmation{}
	err := db.connection.Get(&emailConfirmation, "SELECT * FROM email_confirmation WHERE key=$1", key)
	return emailConfirmation, err
}

func (db Database) CreateEmailConfirmation(tx *sqlx.Tx, key string, account Account) error {
	_, err := tx.NamedExec("INSERT INTO email_confirmation (key, account_id) "+
		"VALUES (:key, :account_id)",
		&EmailConfirmation{Key: key, AccountId: account.Id})
	return err
}

func (db Database) DeleteEmailConfirmation(tx *sqlx.Tx, account Account) error {
	stmt, err := tx.Preparex("DELETE FROM email_confirmation WHERE account_id=$1")
	if err != nil {
		return err
	}
	_, err = stmt.Exec(account.Id)
	return err
}
