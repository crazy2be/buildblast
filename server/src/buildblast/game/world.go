package game

import (
	"log"

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

type ChunkListener interface {
	ChunkGenerated(cc coords.Chunk, chunk mapgen.Chunk)
}

type World struct {
	seed         float64
	chunks       map[coords.Chunk]mapgen.Chunk
	spawns      []coords.World
	chunkGenerator *ChunkGenerator

	entities     []Entity
	entityListeners []EntityListener
	blockListeners []BlockListener
	chunkListeners []ChunkListener
}

func NewWorld(seed float64) *World {
	w := new(World)
	w.seed = seed
	w.chunks = make(map[coords.Chunk]mapgen.Chunk)
	w.spawns = make([]coords.World, 0)

	generator := mapgen.NewMazeArena(seed)
	w.chunkGenerator = NewChunkGenerator(generator)
	go w.chunkGenerator.Run()

	w.entities = make([]Entity, 0)
	w.entityListeners = make([]EntityListener, 0)
	return w
}

func (w *World) Tick() {
	select {
	case generationResult := <-w.chunkGenerator.Generated:
		cc := generationResult.cc
		chunk := generationResult.chunk
		spawns := generationResult.spawns

		w.spawns = append(w.spawns, spawns...)
		w.chunks[cc] = chunk

		for _, listener := range w.chunkListeners {
			listener.ChunkGenerated(cc, chunk)
		}
	default:
	}

	for _, e := range w.entities {
		e.Tick(w)
		id := e.ID()
		pos := e.Pos()
		w.chunkGenerator.QueueChunksNearby(pos)

		for _, listener := range w.entityListeners {
			listener.EntityMoved(id, pos)
		}
	}
}

func (w *World) Chunk(cc coords.Chunk) mapgen.Chunk {
	return w.chunks[cc]
}

func (w *World) AddChunkListener(listener ChunkListener) {
	w.chunkListeners = append(w.chunkListeners, listener)
}

func (w *World) Block(bc coords.Block) mapgen.Block {
	chunk := w.chunks[bc.Chunk()]
	if chunk == nil {
		return mapgen.BLOCK_NIL
	}
	return chunk.Block(bc.Offset())
}

func (w *World) ChangeBlock(bc coords.Block, newBlock mapgen.Block) {
	chunk := w.Chunk(bc.Chunk())

	oc := bc.Offset()
	block := chunk.Block(oc)
	chunk.SetBlock(oc, newBlock)

	for _, listener := range w.blockListeners {
		listener.BlockChanged(bc, block, newBlock)
	}
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

func (w *World) AddEntityListener(listener EntityListener) {
	w.entityListeners = append(w.entityListeners, listener)
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
