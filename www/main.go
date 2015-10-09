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

var processors = map[string]pages.Processor{
	"/":              pages.Index{},
	"/sign-up":       pages.SignUp{},
	"/login":         pages.Login{},
	"/logout":        pages.Logout{},
	"/confirm-email": pages.ConfirmEmail{},
}

var config *sutil.ServerConfig
var dbc *db.Database
var mailer *util.Mailer

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	configPath := flag.String("config", "server_config.json", "Path to server config")
	flag.Parse()
	config = sutil.LoadServerConfig(*configPath)

	dbc = db.NewDatabase(config.DbPass)
	if dbc == nil {
		log.Fatalln("Could not create Database object, which is required.")
	}
	mailer = util.NewMailer(config.MailPass)

	r := mux.NewRouter()
	r.HandleFunc("/confirm-email/{hashKey}", func(w http.ResponseWriter, r *http.Request) {
		handle(processors["/confirm-email"], w, r)
	})
	r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		processor, ok := processors[r.URL.Path]
		if !ok {
			http.ServeFile(w, r, "."+r.URL.Path)
			return
		}

		handle(processor, w, r)
	})

	http.Handle("/", r)

	err := http.ListenAndServe(config.Host+":"+config.WwwPort, nil)
	if err != nil {
		log.Fatalln("ListenAndServe:", err)
	}
}

func handle(processor pages.Processor, w http.ResponseWriter, r *http.Request) {
	cj := sutil.NewCookieJar(w, r, config)
	context := pages.NewContext(dbc, cj, mailer, w, r)

	context.Authenticate()
	processor.Process(context, w, r)
}
