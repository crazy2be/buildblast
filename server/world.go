package main

import (
	"log"
	"sync"
)

type World struct {
	seed       float64
	chunks     map[ChunkCoords]Chunk
	chunkLock  sync.Mutex
	players    map[*Player]bool
	playerLock sync.Mutex

	Join       chan *Player
	Leave      chan *Player
	Broadcast  chan *Message
}

func NewWorld(seed float64) *World {
	w := new(World)
	w.seed = seed;
	w.chunks = make(map[ChunkCoords]Chunk)
	w.players = make(map[*Player]bool)

	w.Join = make(chan *Player)
	w.Leave = make(chan *Player)
	w.Broadcast = make(chan *Message, 10)

	return w
}

func (w *World) RequestChunk(cc ChunkCoords) Chunk {
	w.chunkLock.Lock()
	defer w.chunkLock.Unlock()

	if w.chunks[cc] != nil {
		return w.chunks[cc]
	}

	chunk := GenerateChunk(cc.x, cc.y, cc.z, w.seed)
	w.chunks[cc] = chunk
	return chunk
}

func (w *World) ChangeBlock(wc WorldCoords, newBlock Block) {
	chunk := w.RequestChunk(wc.Chunk())
	chunk.SetBlock(wc.Offset(), newBlock)
}

func (w *World) FindPlayer(name string) *Player {
	w.playerLock.Lock()
	defer w.playerLock.Unlock()

	for player := range w.players {
		if (player.name == name) {
			return player
		}
	}
	return nil
}

func (w *World) broadcast(m *Message) {
	for p := range w.players {
		select {
		case p.Broadcast <- m:
		default:
			log.Println("Cannot send broadcast message", m, "to player", p.name)
			// TODO: Kick player if not responding?
		}
	}
}

func (w *World) join(p *Player) {
	w.playerLock.Lock()
	defer w.playerLock.Unlock()

	m := NewMessage(MSG_ENTITY_CREATE)
	m.Payload["id"] = p.name
	w.broadcast(m)

	for otherPlayer := range w.players {
		m := NewMessage(MSG_ENTITY_CREATE)
		m.Payload["id"] = otherPlayer.name
		p.Broadcast <- m
	}

	w.players[p] = true
	log.Println("New player connected! Name: ", p.name)
}

func (w *World) leave(p *Player) {
	w.playerLock.Lock();
	defer w.playerLock.Unlock();

	delete(w.players, p)
	log.Println("Player disconnected...", p.name)

	m := NewMessage(MSG_ENTITY_REMOVE)
	m.Payload["id"] = p.name
	w.broadcast(m)
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
		}
	}
}
