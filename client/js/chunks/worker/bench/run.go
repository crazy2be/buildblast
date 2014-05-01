package main

import (
	"log"
	"net/http"
)

func main() {
	clientLoc := "../../../.."
	http.HandleFunc("/js/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, clientLoc+r.URL.Path)
	});
	http.HandleFunc("/lib/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, clientLoc+r.URL.Path)
	});
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	});
	log.Println("Ready. Open http://localhost:8000/ to begin.")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
