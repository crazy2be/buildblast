package main

import (
	"log"
	"time"
	"sync"
)

type World struct {
	seed        float64
	chunks      map[ChunkCoords]Chunk
	generator   ChunkGenerator
	chunkLock   sync.Mutex
	clients     []*Client
	players     []*Player
	find       chan FindClientRequest

	Join       chan *Client
	Leave      chan *Client
	Broadcast  chan Message
	StateUpdate chan *PlayerState
}

type FindClientRequest struct {
	name string
	resp chan *Client
}

func NewWorld(seed float64) *World {
	w := new(World)
	w.seed = seed;
	w.chunks = make(map[ChunkCoords]Chunk)
	w.generator = NewMazeArenaGenerator(seed)
	w.clients = make([]*Client, 0)
	w.players = make([]*Player, 0)
	w.find = make(chan FindClientRequest)

	w.Join = make(chan *Client)
	w.Leave = make(chan *Client)
	w.Broadcast = make(chan Message, 10)
	w.StateUpdate = make(chan *PlayerState, 10000000)

	return w
}

func (w *World) RequestChunk(cc ChunkCoords) Chunk {
	w.chunkLock.Lock()
	defer w.chunkLock.Unlock()

	chunk := w.chunks[cc]
	if chunk == nil {
		chunk = w.generator.Chunk(cc)
		w.chunks[cc] = chunk
	}

	return chunk
}

func (w *World) ChangeBlock(wc WorldCoords, newBlock Block) {
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

	p := NewPlayer(c.name, WorldCoords{0.0, 0.0, 0.0})
	w.players = append(w.players, p)
	w.clients = append(w.clients, c)
	log.Println("New player connected! Name: ", p.Name)
}

func (w *World) leave(c *Client) {
	i := w.findClient(c.name)

	w.clients[i] = w.clients[len(w.clients)-1]
	w.clients = w.clients[0:len(w.clients)-1]

	w.players[i] = w.players[len(w.players)-1]
	w.players = w.players[0:len(w.players)-1]

	log.Println("Client disconnected...", c.name)

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

func (w *World) simulateStep(now time.Time) {
// 	println(now)
}

func (w *World) Run() {
	updateTicker := time.Tick(time.Second / 20)
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
		case now := <- updateTicker:
			w.simulateStep(now)
		}
	}
}
