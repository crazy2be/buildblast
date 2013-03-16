package main

import (
	"log"
	"sync"
)

type World struct {
	seed        float64
	chunks      map[ChunkCoords]Chunk
	generator   ChunkGenerator
	chunkLock   sync.Mutex
	players     []*Player
	playerLock  sync.Mutex
	find       chan FindPlayerRequest

	Join       chan *Player
	Leave      chan *Player
	Broadcast  chan *Message
}

type FindPlayerRequest struct {
	name string
	resp chan *Player
}

func NewWorld(seed float64) *World {
	w := new(World)
	w.seed = seed;
	w.chunks = make(map[ChunkCoords]Chunk)
	w.generator = NewFlatArenaGenerator()
	w.players = make([]*Player, 0)
	w.find = make(chan FindPlayerRequest)

	w.Join = make(chan *Player)
	w.Leave = make(chan *Player)
	w.Broadcast = make(chan *Message, 10)

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

func (w *World) FindPlayer(name string) *Player {
	req := FindPlayerRequest {
		name: name,
		resp: make(chan *Player),
	}
	w.find <- req

	return <-req.resp
}

func (w *World) broadcast(m *Message) {
	for name, p := range w.players {
		select {
		case p.Broadcast <- m:
		default:
			log.Println("Cannot send broadcast message", m, "to player", name)
			// TODO: Kick player if not responding?
		}
	}
}

func (w *World) join(p *Player) {
	m := NewMessage(MSG_ENTITY_CREATE)
	m.Payload["id"] = p.name
	w.broadcast(m)

	for _, otherPlayer := range w.players {
		m := NewMessage(MSG_ENTITY_CREATE)
		m.Payload["id"] = otherPlayer.name
		p.Broadcast <- m
	}

	w.players = append(w.players, p)
	log.Println("New player connected! Name: ", p.name)
}

func (w *World) leave(p *Player) {
	i := w.findPlayer(p.name)
	w.players[i] = w.players[len(w.players)-1]
	w.players = w.players[0:len(w.players)-1]

	log.Println("Player disconnected...", p.name)

	m := NewMessage(MSG_ENTITY_REMOVE)
	m.Payload["id"] = p.name
	w.broadcast(m)
}

func (w *World) findPlayer(name string) int {
	for i, p := range w.players {
		if p.name == name {
			return i
		}
	}
	return -1
}

func (w *World) Run() {
	for {
		select {
		case p := <-w.Join:
			w.join(p)
		case p := <-w.Leave:
			w.leave(p)
		case m := <-w.Broadcast:
			w.broadcast(m)
		case req := <-w.find:
			i := w.findPlayer(req.name)
			req.resp <- w.players[i]
		}
	}
}
