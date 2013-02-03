package main

import (
	"io"
	"log"
	"net/http"
	"code.google.com/p/go.net/websocket"
)

func handler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "." + r.URL.Path)
}


func wsHandler(ws *websocket.Conn) {
	io.Copy(ws, ws)
}

func main() {
	http.HandleFunc("/", handler)
	http.Handle("/ws", websocket.Handler(wsHandler))
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}