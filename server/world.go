package main

import (
	"log"
	"math/rand"
)

type World struct {
	seed float64
	chunks map[ChunkCoords]Chunk
	players map[*Player]bool
	register chan *Player
	unregister chan *Player
	broadcast chan *Message
}

func newWorld() *World {
	w := new(World)
	w.seed = rand.Float64();
	w.chunks = make(map[ChunkCoords]Chunk)
	w.players = make(map[*Player]bool)
	w.register = make(chan *Player)
	w.unregister = make(chan *Player)
	w.broadcast = make(chan *Message)
	return w
}

// TODO: This function has terrific race conditions...
func (w *World) requestChunk(c ChunkCoords) Chunk {
	if w.chunks[c] != nil {
		return w.chunks[c]
	}

	chunk := generateChunk(c.x, c.y, c.z, w.seed)
	w.chunks[c] = chunk
	return chunk
}

func (w *World) changeBlock(wc WorldCoords, typ Block) {
	chunk := w.requestChunk(wc.Chunk())
	o := wc.Offset()
	chunk[o.x][o.y][o.z] = typ
}

func (w *World) run() {
	for {
		select {
		case p := <-w.register:
			w.players[p] = true
			log.Println("New player connected! Name: ", p.name)
		case p := <-w.unregister:
			delete(w.players, p)
			log.Println("Player disconnected...", p.name)
		case m := <-w.broadcast:
			for p := range w.players {
				select {
				case p.inBroadcast <- m:
				default:
					p.ws.Close()
				}
			}
		}
	}
}
