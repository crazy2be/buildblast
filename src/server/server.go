package main

import (
	"log"
	"net/http"
	"math/rand"
	"code.google.com/p/go.net/websocket"
)

var globalMapSeed = rand.Float64();

func handler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "." + r.URL.Path)
}

type Message struct {
	Kind string
	Payload map[string]interface{}
}

func handleChunk(ms *Message) {
	p := ms.Payload
	cx := int(p["cx"].(float64))
	cy := int(p["cy"].(float64))
	cz := int(p["cz"].(float64))
	chunk := generateChunk(cx, cy, cz, globalMapSeed)
	
	p["data"] = chunk
}

func wsHandler(ws *websocket.Conn) {
	for {
		ms := new(Message)
		err := websocket.JSON.Receive(ws, ms)
		if err != nil {
			panic(err)
		}
		switch ms.Kind {
			case "chunk":
				handleChunk(ms)
			default:
				log.Print("Unknown message recieved from client of kind ", ms.Kind)
		}
		
		err = websocket.JSON.Send(ws, ms)
		if err != nil {
			panic(err)
		}
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