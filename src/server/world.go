package main

import (
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