package game

import (
	"log"
	"sync"

	"buildblast/coords"
	"buildblast/physics"
	"buildblast/mapgen"
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

type BlockListener interface {
	BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block)
}

type World struct {
	seed         float64
	chunks       map[coords.Chunk]mapgen.Chunk
	chunkLock    sync.Mutex
	generator    mapgen.ChunkSource

	entities     []Entity
	entityListeners []EntityListener
	blockListeners []BlockListener
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
	// chunkLock required because of issue #88.
	// We should remove it.
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

func (w *World) Block(bc coords.Block) mapgen.Block {
	cc := bc.Chunk()

	w.chunkLock.Lock()
	chunk := w.chunks[cc]
	w.chunkLock.Unlock()

	if chunk == nil {
		return mapgen.BLOCK_NIL
	}

	return chunk.Block(bc.Offset())
}

func (w *World) AddBlockListener(listener BlockListener) {
	w.blockListeners = append(w.blockListeners, listener)
}

func (w *World) RemoveBlockListener(listener BlockListener) {
	for i, other := range w.blockListeners {
		if other == listener {
			w.blockListeners[i] = w.blockListeners[len(w.blockListeners) - 1]
			w.blockListeners = w.blockListeners[:len(w.blockListeners) - 1]
			return
		}
	}
	log.Println("WARN: Attempt to remove block listener which does not exist.")
}

func (w *World) ChangeBlock(bc coords.Block, newBlock mapgen.Block) {
	chunk := w.RequestChunk(bc.Chunk())

	oc := bc.Offset()
	block := chunk.Block(oc)
	chunk.SetBlock(oc, newBlock)

	for _, listener := range w.blockListeners {
		listener.BlockChanged(bc, block, newBlock)
	}
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
