package main

import (
	"fmt"
	"math"
	"math/rand"
)

type World struct {
	seed float64
	chunks map[string]Chunk
	players map[*Player]bool
	register chan *Player
	unregister chan *Player
	broadcast chan *Message
}

func newWorld() *World {
	w := new(World)
	w.seed = rand.Float64();
	w.chunks = make(map[string]Chunk)
	w.players = make(map[*Player]bool)
	w.register = make(chan *Player)
	w.unregister = make(chan *Player)
	w.broadcast = make(chan *Message)
	return w
}

func chunkID(cx, cy, cz int) string {
	return fmt.Sprintf("%d,%d,%d", cx, cy, cz)
}

// TODO: This function has terrific race conditions...
func (w *World) requestChunk(cx, cy, cz int) Chunk {
	id := chunkID(cx, cy, cz)
	if w.chunks[id] != nil {
		return w.chunks[id]
	}
	
	chunk := generateChunk(cx, cy, cz, w.seed)
	w.chunks[id] = chunk
	return chunk
}

func myMod(a float64, b float64) float64 {
	return math.Mod(math.Mod(a, b) + b, b)
}

func (w *World) changeBlock(wx, wy, wz float64, typ Block) {
	cx := int(math.Floor(wx / float64(CHUNK_WIDTH)))
	cy := int(math.Floor(wy / float64(CHUNK_HEIGHT)))
	cz := int(math.Floor(wz / float64(CHUNK_DEPTH)))
	ox := int(myMod(math.Floor(wx), float64(CHUNK_WIDTH)))
	oy := int(myMod(math.Floor(wy), float64(CHUNK_HEIGHT)))
	oz := int(myMod(math.Floor(wz), float64(CHUNK_DEPTH)))
	
	chunk := w.requestChunk(cx, cy, cz)
	chunk[ox][oy][oz] = typ
}

func (w *World) run() {
	for {
		select {
		case p := <-w.register:
			w.players[p] = true
		case p := <-w.unregister:
			delete(w.players, p)
			close(p.inBroadcast)
		case m := <-w.broadcast:
			for p := range w.players {
				select {
				case p.inBroadcast <- m:
				default:
					delete(w.players, p)
					close(p.inBroadcast)
				}
			}
		}
	}
}