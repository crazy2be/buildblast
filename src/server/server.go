package main

import (
	"log"
	"net/http"
	"code.google.com/p/go.net/websocket"
)

var globalWorld = newWorld()

func handler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "." + r.URL.Path)
}

type Message struct {
	Kind string
	Payload map[string]interface{}
}

type Player struct {
	ws *websocket.Conn
	in chan *Message
	out chan *Message
	inBroadcast chan *Message
	outBroadcast chan *Message
}

func newPlayer(ws *websocket.Conn) *Player {
	p := new(Player)
	p.ws = ws
	p.in = make(chan *Message, 10)
	p.out = make(chan *Message, 10)
	p.inBroadcast = make(chan *Message, 10)
	p.outBroadcast = make(chan *Message, 10)
	return p
}

func (p *Player) handleIncoming() {
	for {
		ms := new(Message)
		err := websocket.JSON.Receive(p.ws, ms)
		log.Print("recieved new message")
		if err != nil {
			log.Print(err)
			return
		}
		p.in <- ms
	}
}

func (p *Player) handleOutgoing() {
	for {
		ms := <-p.out
		err := websocket.JSON.Send(p.ws, ms)
		log.Print("sent new message")
		if err != nil {
			log.Print(err)
			return
		}
	}
}

func (p *Player) handleChunk(ms *Message) {
	pl := ms.Payload
	cx := int(pl["cx"].(float64))
	cy := int(pl["cy"].(float64))
	cz := int(pl["cz"].(float64))
	chunk := generateChunk(cx, cy, cz, 0.311)
	
	pl["data"] = chunk
}

// func (p *Player) handleBlock(ms *Message) {
// 	pl := ms.Payload
// 	wx := pl["wx"].(float64)
// 	wy := pl["wy"].(float64)
// 	wz := pl["wz"].(float64)
// 	typ := pl["typ"].(float64)
// 	
// 	
// }

func wsHandler(ws *websocket.Conn) {
	p := newPlayer(ws)
	globalWorld.register <- p
	defer func () {
		globalWorld.unregister <- p
	}()
	go p.handleIncoming()
	go p.handleOutgoing()
	
	for {
		select {
		case m := <-p.in:
			switch m.Kind {
			case "chunk":
				p.handleChunk(m)
			case "block":
				globalWorld.broadcast <- m
			default:
				log.Print("Unknown message recieved from client of kind ", m.Kind)
				continue
			}
			p.out <- m
		case m := <-p.inBroadcast:
			log.Print("Recieved broadcast message")
			p.out <- m
		}
	}
}

func main() {
	go globalWorld.run()
	http.HandleFunc("/", handler)
	http.Handle("/ws", websocket.Handler(wsHandler))
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}