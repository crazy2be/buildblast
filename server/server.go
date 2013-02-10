package main

import (
	"io"
	"log"
	"fmt"
	"net/http"
	"math"
	mrand "math/rand"
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

func (p *Player) sendChunk(cc ChunkCoords) {
	ms := newMessage("chunk")
	ms.Payload["ccpos"] = cc.toMap()
	cw := CHUNK_WIDTH
	ch := CHUNK_HEIGHT
	cd := CHUNK_DEPTH
	ms.Payload["size"] = map[string]interface{}{
		"w": cw,
		"h": ch,
		"d": cd,
	}

	chunk := p.w.requestChunk(cc)
	p.loadedChunks[cc] = true

	data := make([]Block, cw*ch*cd)
	for x := 0; x < cw; x++ {
		for y := 0; y < ch; y++ {
			for z := 0; z < cd; z++ {
				data[x*cw*ch + y*cw + z] = chunk[x][y][z]
			}
		}
	}
	ms.Payload["data"] = data
	p.out <- ms
}

func (p *Player) sendUnloadChunk(cc ChunkCoords) {
	ms := newMessage("unload-chunk")
	ms.Payload["ccpos"] = cc.toMap()

	delete(p.loadedChunks, cc)
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

	DIST := 3

	cc := wc.Chunk()
	for x := -DIST; x <= DIST; x++ {
		for y := -DIST; y <= DIST; y++ {
			for z := -DIST; z <= DIST; z++ {
				newCC := ChunkCoords{
					x: cc.x + x,
					y: cc.y + y,
					z: cc.z + z,
				}
				if p.loadedChunks[newCC] != true {
					// Stagger chunk loading
					// biased towards loading chunks nearest
					// the player's position.
// 					val := mrand.Float64()
// 					val *= float64(cc.x - x)
// 					val *= float64(cc.y - y)
// 					val *= float64(cc.z - z)
// 					if math.Abs(val) < 1 {
						p.sendChunk(newCC)
// 					}
				}
			}
		}
		_ = mrand.Float64
		_ = math.Abs
	}

// 	abs := func (n float64) float64 {
// 		return math.Abs(n)
// 	}
//
// 	max := func (a, b float64) float64 {
// 		return math.Max(a, b)
// 	}

	for lcc := range p.loadedChunks {
		if lcc.x < cc.x - DIST || lcc.x > cc.x + DIST ||
		   lcc.y < cc.y - DIST || lcc.y > cc.y + DIST ||
		   lcc.z < cc.z - DIST || lcc.z > cc.z + DIST {
			// Stagger chunk unloading
			// Should be biased towards unloading
			// chunks furthest from the player.
// 			val := mrand.Float64()
// 			val *= max(abs(float64(cc.x - lcc.x)) - 2, 1)
// 			val *= max(abs(float64(cc.y - lcc.y)) - 2, 1)
// 			val *= max(abs(float64(cc.z - lcc.z)) - 2, 1)
// 			if (math.Abs(val) > 0.9) {
				p.sendUnloadChunk(lcc)
// 			}
		}
	}
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
