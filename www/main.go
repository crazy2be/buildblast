package main

import (
	"encoding/hex"
	"flag"
	"log"
	"net/http"
	"runtime"

	"github.com/gorilla/mux"

	"buildblast/shared/db"
	sutil "buildblast/shared/util"
	"buildblast/www/pages"
	"buildblast/www/util"
)

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	dbPass := flag.String("dbpass", "", "REQUIRED: The password for accessing the buildblast database")
	authKey := flag.String("authkey", "", "REQUIRED: The key for authenticating the cookie store")
	encKey := flag.String("enckey", "", "REQUIRED: The key for encrypting the cookie store. Must be 16, 24, or 32 byte hex")
	mailPass := flag.String("mailpass", "", "REQUIRED: The password for authenticating with smtp")
	flag.Parse()

	if *dbPass == "" {
		log.Fatalln("Database password is required")
	}

	if *authKey == "" {
		log.Fatalln("Cookie authentication key is required")
	}

	if *encKey == "" {
		log.Fatalln("Cookie encoding key is required")
	}

	if *mailPass == "" {
		log.Fatalln("Mail password is required")
	}

	encryptionKey, err := hex.DecodeString(*encKey)
	keylen := len(encryptionKey)
	if err != nil && !(keylen == 16 || keylen == 24 || keylen == 32) {
		log.Fatalln("Encryption key must be a 16, 24 or 32 byte hex string")
	}

	processors := map[string]pages.Processor{
		"/":        pages.Index{},
		"/sign-up": pages.SignUp{},
		"/login":   pages.Login{},
		"/logout":  pages.Logout{},
	}

	db := db.NewDatabase(*dbPass)
	mailer := util.NewMailer(*mailPass)

	r := mux.NewRouter()
	r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		processor, ok := processors[r.URL.Path]
		if !ok {
			http.ServeFile(w, r, "."+r.URL.Path)
			return
		}

		cj := sutil.NewCookieJar(w, r, []byte(*authKey), encryptionKey)
		context := pages.NewContext(db, cj, mailer, w, r)

		context.Authenticate()
		processor.Process(context, w, r)
	})

	http.Handle("/", r)

	err = http.ListenAndServe(":8081", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
