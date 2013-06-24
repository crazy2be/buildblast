package main

import (
	"sync"

	"buildblast/physics"
	"buildblast/mapgen"
	"buildblast/coords"
)

type Entity interface {
	Tick(w *World)
	Damage(amount int, what string)
	BoxAt(t float64) *physics.Box
	Pos() coords.World
	ID() string
}

type World struct {
	seed         float64
	chunks       map[coords.Chunk]mapgen.Chunk
	chunkLock    sync.Mutex
	generator    mapgen.ChunkSource

	entities     []Entity

	EntityCreate chan string
	EntityRemove chan string
}

func NewWorld(seed float64) *World {
	w := new(World)
	w.seed = seed;
	w.chunks = make(map[coords.Chunk]mapgen.Chunk)
	w.generator = mapgen.NewMazeArena(seed)

	w.entities = make([]Entity, 0)

	w.EntityCreate = make(chan string, 10)
	w.EntityRemove = make(chan string, 10)

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

func (w *World) AddEntity(e Entity) {
	w.entities = append(w.entities, e)
	w.EntityCreate <- e.ID()
}

func (w *World) RemoveEntity(e Entity) {
	for i, entity := range w.entities {
		if entity == e {
			w.entities[i] = w.entities[len(w.entities) - 1]
			w.entities = w.entities[:len(w.entities) - 1]
			w.EntityRemove <- e.ID()
		}
	}
}

func (w *World) GetEntityIDs() []string {
	result := make([]string, len(w.entities))
	for i, entity := range w.entities {
		result[i] = entity.ID()
	}
	return result
}

func (w *World) Tick(g *Game) {
	for _, e := range w.entities {
		e.Tick(w)
		g.BroadcastLossy(&MsgEntityPosition{
			Pos: e.Pos(),
			ID: e.ID(),
		})
	}
}

func (w *World) FindFirstIntersect(entity Entity, t float64, ray *physics.Ray) (*coords.World, Entity) {
	boxes := make([]*physics.Box, len(w.entities))
	for i, other := range w.entities {
		if other == entity {
			boxes[i] = nil
		} else {
			boxes[i] = other.BoxAt(t)
		}
	}

	hitPos, hitIndex := ray.FindAnyIntersect(w, boxes)
	if hitIndex != -1 {
		return hitPos, w.entities[hitIndex]
	}
	return hitPos, nil
}
