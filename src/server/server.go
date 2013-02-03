package main

import (
	"log"
	"net/http"
	"encoding/json"
	"code.google.com/p/go.net/websocket"
)

func handler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "." + r.URL.Path)
}

type ChunkRequest struct {
	CX int
	CY int
	CZ int
	Seed float64
}
func wsHandler(ws *websocket.Conn) {
	dec := json.NewDecoder(ws)
	cr := new(ChunkRequest)
	err := dec.Decode(cr)
	if err != nil {
		panic(err)
	}
	
	chunk := generateChunk(cr.CX, cr.CY, cr.CZ, cr.Seed)
	
	enc := json.NewEncoder(ws)
	err = enc.Encode(chunk)
	if err != nil {
		panic(err)
	}
}

func main() {
	http.HandleFunc("/", handler)
	http.Handle("/ws", websocket.Handler(wsHandler))
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}