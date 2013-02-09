package main

import (
	"io"
	"log"
	"fmt"
	"net/http"
	"crypto/rand"
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

func newMessage(kind string) *Message {
	ms := new(Message)
	ms.Kind = kind
	ms.Payload = make(map[string]interface{})
	return ms
}

func (m *Message) String() string {
	return fmt.Sprintf("{kind: %s, payload: %v}", m.Kind, m.Payload)
}

// http://stackoverflow.com/questions/12771930/what-is-the-fastest-way-to-generate-a-long-random-string-in-go
func randString(n int) string {
	const alphanum = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	var bytes = make([]byte, n)
	rand.Read(bytes)
	for i, b := range bytes {
		bytes[i] = alphanum[b % byte(len(alphanum))]
	}
	return string(bytes)
}

type Player struct {
	w *World
	ws *websocket.Conn
	in chan *Message
	out chan *Message
	name string
	inBroadcast chan *Message
	loadedChunks map[ChunkCoords]bool
}

func newPlayer(ws *websocket.Conn) *Player {
	p := new(Player)
	p.w = globalWorld
	p.ws = ws
	p.in = make(chan *Message, 10)
	p.out = make(chan *Message, 10)
	p.name = "player-" + randString(10)
	p.inBroadcast = make(chan *Message, 10)
	p.loadedChunks = make(map[ChunkCoords]bool, 0)
	return p
}

func (p *Player) handleIncoming() {
	for {
		ms := new(Message)
		err := websocket.JSON.Receive(p.ws, ms)
		if err != nil {
			if err != io.EOF {
				log.Print("Reading websocket message (", p.name, "): ", err)
			}
			close(p.in)
			return
		}
		p.in <- ms
	}
}

func (p *Player) handleOutgoing() {
	for {
		ms := <-p.out
		err := websocket.JSON.Send(p.ws, ms)
		if err != nil {
			log.Print("Sending websocket message (", p.name, "): ", err)
			close(p.out)
			return
		}
	}
}

func (p *Player) handleChunk(ms *Message) {
	pl := ms.Payload
	cc := ChunkCoords{
		x: int(pl["x"].(float64)),
		y: int(pl["y"].(float64)),
		z: int(pl["z"].(float64)),
	}
	chunk := p.w.requestChunk(cc)
	p.loadedChunks[cc] = true

	pl["data"] = chunk
	p.out <- ms
}

func (p *Player) sendChunk(cc ChunkCoords) {
	ms := newMessage("chunk")
	ms.Payload["x"] = cc.x
	ms.Payload["y"] = cc.y
	ms.Payload["z"] = cc.z
	chunk := p.w.requestChunk(cc)
	p.loadedChunks[cc] = true
	ms.Payload["data"] = chunk
	p.out <- ms
}

func (p *Player) handleBlock(ms *Message) {
	pl := ms.Payload
	wc := readWorldCoords(pl)
	typ := Block(pl["type"].(float64))

	p.w.changeBlock(wc, typ)
	p.w.broadcast <- ms
}

func (p *Player) handlerPlayerPosition(ms *Message) {
	pl := ms.Payload
	// TODO: Verify position is valid
	// (they didn't move too much in the last
	// couple frames, and they are not currently
	// in the ground).
	wc := readWorldCoords(pl["pos"].(map[string]interface{}))

	pl["id"] = p.name
	ms.Kind = "entity-position"
	p.w.broadcast <- ms

	cc := wc.Chunk()
	for x := -1; x < 2; x++ {
		for y := -1; y < 2; y++ {
			for z := -1; z < 2; z++ {
				newCC := ChunkCoords{
					x: cc.x + x,
					y: cc.y + y,
					z: cc.z + z,
				}
				if p.loadedChunks[newCC] != true {
					p.sendChunk(newCC)
				}
			}
		}
	}
	// TODO: Unload far away chunks.
}

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
			if m == nil {
				return
			}
			switch m.Kind {
			case "chunk":
				go p.handleChunk(m)
			case "block":
				go p.handleBlock(m)
			case "player-position":
				go p.handlerPlayerPosition(m)
			default:
				log.Print("Unknown message recieved from client of kind ", m.Kind)
				continue
			}
		case m := <-p.inBroadcast:
			if m.Kind == "entity-position" && p.name == m.Payload["id"] {
				continue
			}
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
