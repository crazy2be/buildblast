package main

import (
	"log"
// 	"fmt"
	"time"
	"sync"

	"buildblast/mapgen"
	"buildblast/coords"
)

type World struct {
	seed        float64
	chunks      map[coords.Chunk]mapgen.Chunk
	generator   mapgen.ChunkSource
	chunkLock   sync.Mutex
	clients     []*Client
	players     []*Player
	previousTime time.Time
	find       chan FindClientRequest

	Join       chan *Client
	Leave      chan *Client
	Broadcast  chan Message
}

type FindClientRequest struct {
	name string
	resp chan *Client
}

func NewWorld(seed float64) *World {
	w := new(World)
	w.seed = seed;
	w.chunks = make(map[coords.Chunk]mapgen.Chunk)
	w.generator = mapgen.NewMazeArena(seed)
	w.clients = make([]*Client, 0)
	w.players = make([]*Player, 0)
	w.previousTime = time.Now()
	w.find = make(chan FindClientRequest)

	w.Join = make(chan *Client)
	w.Leave = make(chan *Client)
	w.Broadcast = make(chan Message, 10)

	return w
}

func (w *World) RequestChunk(cc coords.Chunk) mapgen.Chunk {
	w.chunkLock.Lock()
	defer w.chunkLock.Unlock()

	chunk := w.chunks[cc]
	if chunk == nil {
		chunk = w.generator.Chunk(cc)
		w.chunks[cc] = chunk
	}

	return chunk
}

func (w *World) Block(wc coords.World) mapgen.Block {
	w.chunkLock.Lock()
	defer w.chunkLock.Unlock()

	cc := wc.Chunk()
	oc := wc.Offset()
	chunk := w.chunks[cc]
	if chunk == nil {
		return mapgen.BLOCK_NIL
	}
	return chunk.Block(oc)
}

func (w *World) ChangeBlock(wc coords.World, newBlock mapgen.Block) {
	chunk := w.RequestChunk(wc.Chunk())
	chunk.SetBlock(wc.Offset(), newBlock)
}

func (w *World) FindClient(name string) *Client {
	req := FindClientRequest {
		name: name,
		resp: make(chan *Client),
	}
	w.find <- req

	return <-req.resp
}

func (w *World) announce(message string) {
	log.Println("[ANNOUNCE]", message)
	w.broadcast(&MsgChat{
		DisplayName: "SERVER",
		Message: message,
	})
}

func (w *World) broadcast(m Message) {
	for _, c := range w.clients {
		select {
		case c.Broadcast <- m:
		default:
			log.Println("Cannot send broadcast message", m, "to player", c.name)
			// TODO: Kick player if not responding?
		}
	}
}

func (w *World) join(c *Client) {
	m := &MsgEntityCreate{
		ID: c.name,
	}
	w.broadcast(m)

	for _, otherClient := range w.clients {
		m := &MsgEntityCreate{
			ID: otherClient.name,
		}
		c.Broadcast <- m
	}

	p := NewPlayer()
	w.players = append(w.players, p)
	w.clients = append(w.clients, c)
	w.announce(c.name + " has joined the game!")
}

func (w *World) leave(c *Client) {
	i := w.findClient(c.name)

	// Remove the client and player from our lists.
	w.clients[i] = w.clients[len(w.clients)-1]
	w.clients = w.clients[0:len(w.clients)-1]

	w.players[i] = w.players[len(w.players)-1]
	w.players = w.players[0:len(w.players)-1]

	w.announce(c.name + " has left the game :(")

	m := &MsgEntityRemove{
		ID: c.name,
	}
	w.broadcast(m)
}

func (w *World) findClient(name string) int {
	for i, c := range w.clients {
		if c.name == name {
			return i
		}
	}
	return -1
}

func (w *World) simulateStep() {
	for i, p := range w.players {
		client := w.clients[i]

		var controls *ControlState
		select {
		case controls = <-client.ControlState:
		default: continue
		}

		playerStateMsg, debugRayMsg := p.simulateStep(w, controls)

		if playerStateMsg != nil {
			select {
			case client.StateUpdates <- playerStateMsg:
			default:
			}
		}
		if debugRayMsg != nil {
			select {
			case client.Broadcast <- debugRayMsg:
			default:
			}
		}

		m := &MsgEntityPosition{
			Pos: p.pos,
			ID: client.name,
		}
		w.broadcast(m)
	}
}

func (w *World) Run() {
	updateTicker := time.Tick(time.Second / 60)
	for {
		select {
		case p := <-w.Join:
			w.join(p)
		case p := <-w.Leave:
			w.leave(p)
		case m := <-w.Broadcast:
			w.broadcast(m)
		case req := <-w.find:
			i := w.findClient(req.name)
			req.resp <- w.clients[i]
		case <-updateTicker:
			w.simulateStep()
		}
	}
}
