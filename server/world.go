package main

import (
	"log"
	"time"
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
	w.seed = float64(time.Now().Unix());
	w.chunks = make(map[ChunkCoords]Chunk)
	w.players = make(map[*Player]bool)
	w.register = make(chan *Player)
	w.unregister = make(chan *Player)
	w.broadcast = make(chan *Message)
	return w
}

// TODO: This function has terrific race conditions...
func (w *World) requestChunk(cc ChunkCoords) Chunk {
	if w.chunks[cc] != nil {
		return w.chunks[cc]
	}

	chunk := generateChunk(cc.x, cc.y, cc.z, w.seed)
	w.chunks[cc] = chunk
	return chunk
}

func (w *World) changeBlock(wc WorldCoords, newBlock Block) {
	chunk := w.requestChunk(wc.Chunk())
	chunk.SetBlock(wc.Offset(), newBlock)
}

func (w *World) findPlayer(name string) *Player {
	for player := range w.players {
		if (player.name == name) {
			return player
		}
	}
	return nil
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
					log.Println("Cannot send broadcast message", m, "to player", p.name)
// 					p.ws.Close()
				}
			}
		}
	}
}
