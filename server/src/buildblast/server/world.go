package main

import (
	"log"
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
	w.find = make(chan FindClientRequest)

	w.Join = make(chan *Client)
	w.Leave = make(chan *Client)
	w.Broadcast = make(chan Message, 10)

	return w
}

func (w *World) RequestChunk(cc coords.Chunk) mapgen.Chunk {
	w.chunkLock.Lock()
	chunk := w.chunks[cc]
	w.chunkLock.Unlock()

	if chunk == nil {
		chunk = w.generator.Chunk(cc)

		w.chunkLock.Lock()
		w.chunks[cc] = chunk
		w.chunkLock.Unlock()
	}

	return chunk
}

func (w *World) Block(wc coords.World) mapgen.Block {
	cc := wc.Chunk()

	w.chunkLock.Lock()
	chunk := w.chunks[cc]
	w.chunkLock.Unlock()

	if chunk == nil {
		return mapgen.BLOCK_NIL
	}

	return chunk.Block(wc.Offset())
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
		c.Send(m)
	}
}

func (w *World) broadcastLossy(m Message) {
	for _, c := range w.clients {
		c.SendLossy(m)
	}
}

func (w *World) join(c *Client) {
	for _, otherClient := range w.clients {
		if otherClient.name == c.name {
			c.Send(&MsgChat{
				DisplayName: "SERVER",
				Message: "Player with name " + c.name + " already playing on this server.",
			})
			return
		}
	}

	w.broadcast(&MsgEntityCreate{
		ID: c.name,
	})

	for _, otherClient := range w.clients {
		c.Send(&MsgEntityCreate{
			ID: otherClient.name,
		})
	}

	p := NewPlayer(w, c.name)
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

		playerStateMsg, debugRayMsg := p.simulateStep(controls)

		if playerStateMsg != nil {
			client.Send(playerStateMsg)
		}
		if debugRayMsg != nil {
			client.Send(debugRayMsg)
		}

		m := &MsgEntityPosition{
			Pos: p.pos,
			ID: client.name,
		}
		w.broadcastLossy(m)
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
