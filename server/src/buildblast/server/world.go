package main

import (
	"sync"
	"log"

	"buildblast/physics"
	"buildblast/mapgen"
	"buildblast/coords"
)

type Entity interface {
	Tick(w *World)
	Damage(amount int)
	Dead() bool
	Respawn()
	BoxAt(t float64) *physics.Box
	Pos() coords.World
	ID() string
}

type EntityListener interface {
	EntityCreated(id string)
	EntityMoved(id string, pos coords.World)
	EntityDied(id string, killer string)
	EntityRemoved(id string)
}

type World struct {
	seed         float64
	chunks       map[coords.Chunk]mapgen.Chunk
	chunkLock    sync.Mutex
	generator    mapgen.ChunkSource

	entities     []Entity
	entityListeners []EntityListener
}

func NewWorld(seed float64) *World {
	w := new(World)
	w.seed = seed;
	w.chunks = make(map[coords.Chunk]mapgen.Chunk)
	w.generator = mapgen.NewMazeArena(seed)

	w.entities = make([]Entity, 0)
	w.entityListeners = make([]EntityListener, 0)
	return w
}

func (w *World) RequestChunk(cc coords.Chunk) mapgen.Chunk {
	w.chunkLock.Lock()
	chunk := w.chunks[cc]
	w.chunkLock.Unlock()

	if chunk == nil {
		chunk = w.generator.Chunk(cc)
		log.Println("Generated chunk at ", cc)

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

func (w *World) AddEntityListener(listener EntityListener) {
	w.entityListeners = append(w.entityListeners, listener)
}

func (w *World) AddEntity(e Entity) {
	w.entities = append(w.entities, e)

	for _, listener := range w.entityListeners {
		listener.EntityCreated(e.ID())
	}
}

func (w *World) RemoveEntity(e Entity) {
	for i, entity := range w.entities {
		if entity == e {
			w.entities[i] = w.entities[len(w.entities) - 1]
			w.entities = w.entities[:len(w.entities) - 1]

			for _, listener := range w.entityListeners {
				listener.EntityRemoved(e.ID())
			}
		}
	}
}

func (w *World) DamageEntity(damager string, amount int, e Entity) {
	e.Damage(amount)
	if e.Dead() {
		e.Respawn()
		for _, listener := range w.entityListeners {
			listener.EntityDied(e.ID(), damager)
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

func (w *World) Tick() {
	for _, e := range w.entities {
		e.Tick(w)

		for _, listener := range w.entityListeners {
			listener.EntityMoved(e.ID(), e.Pos())
		}
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
