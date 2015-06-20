package main

import (
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

	configPath := flag.String("config", "server_config.json", "Path to server config")
	flag.Parse()
	config := sutil.LoadServerConfig(*configPath)

	processors := map[string]pages.Processor{
		"/":        pages.Index{},
		"/sign-up": pages.SignUp{},
		"/login":   pages.Login{},
		"/logout":  pages.Logout{},
	}

	db := db.NewDatabase(config.DbPass)
	mailer := util.NewMailer(config.MailPass)

	r := mux.NewRouter()
	r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		processor, ok := processors[r.URL.Path]
		if !ok {
			http.ServeFile(w, r, "."+r.URL.Path)
			return
		}

		cj := sutil.NewCookieJar(w, r, config.CookieKeyPairs...)
		context := pages.NewContext(db, cj, mailer, w, r)

		context.Authenticate()
		processor.Process(context, w, r)
	})

	http.Handle("/", r)

	err := http.ListenAndServe(config.Host+":"+config.WwwPort, nil)
	if err != nil {
		log.Fatalln("ListenAndServe:", err)
	}
}
