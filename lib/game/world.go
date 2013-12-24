package game

import (
	"log"
	"math/rand"

	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
	"buildblast/lib/physics"
)

type BlockListener interface {
	BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block)
}

type World struct {
	seed           float64
	chunks         map[coords.Chunk]mapgen.Chunk
	spawns         []coords.World
	chunkGenerator *ChunkGenerator

	entities        []Entity
	entityListeners []EntityListener
	blockListeners  []BlockListener
}

func NewWorld(seed float64) *World {
	w := new(World)
	w.seed = seed
	w.chunks = make(map[coords.Chunk]mapgen.Chunk)
	w.spawns = make([]coords.World, 0)

	generator := mapgen.NewFlatWorld(seed)
	w.chunkGenerator = NewChunkGenerator(generator)
	go w.chunkGenerator.Run()

	w.entities = make([]Entity, 0)
	w.entityListeners = make([]EntityListener, 0)
	return w
}

func (w *World) Tick() {
	w.generationTick()
	for _, e := range w.entities {
		e.Tick(w)
		w.chunkGenerator.QueueChunksNearby(e.Pos())
	}
}

func (w *World) generationTick() {
	select {
	case generationResult := <-w.chunkGenerator.Generated:
		cc := generationResult.cc
		chunk := generationResult.chunk
		spawns := generationResult.spawns

		w.spawns = append(w.spawns, spawns...)
		w.chunks[cc] = chunk
	default:
	}
}

func (w *World) findSpawn() coords.World {
	l := len(w.spawns)
	if l <= 0 {
		return coords.World{
			X: 0,
			Y: 21,
			Z: 0,
		}
	}
	return w.spawns[rand.Intn(l)];
}

func (w *World) Chunk(cc coords.Chunk) mapgen.Chunk {
	return w.chunks[cc]
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
			w.blockListeners[i] = w.blockListeners[len(w.blockListeners)-1]
			w.blockListeners = w.blockListeners[:len(w.blockListeners)-1]
			return
		}
	}
	log.Println("WARN: Attempt to remove block listener which does not exist.")
}

func (w *World) AddEntity(e Entity) {
	w.entities = append(w.entities, e)
	e.Respawn(w.findSpawn())

	for _, listener := range w.entityListeners {
		listener.EntityCreated(e.ID(), e)
	}
}

func (w *World) RemoveEntity(e Entity) {
	for i, entity := range w.entities {
		if entity == e {
			w.entities[i] = w.entities[len(w.entities)-1]
			w.entities = w.entities[:len(w.entities)-1]

			for _, listener := range w.entityListeners {
				listener.EntityRemoved(e.ID())
			}
		}
	}
}

func (w *World) DamageEntity(damager string, amount int, e Entity) {
	e.Damage(amount)
	if e.Dead() {
		e.Respawn(w.findSpawn())
		for _, listener := range w.entityListeners {
			listener.EntityDied(e.ID(), e, damager)
		}
	} else {
		// Should we fire Damaged events if they
		// end up dying? I dunno. Currently we don't.
		for _, listener := range w.entityListeners {
			listener.EntityDamaged(e.ID(), e)
		}
	}
}

func (w *World) Entities() map[EntityID]Entity {
	result := make(map[EntityID]Entity, len(w.entities))
	for _, entity := range w.entities {
		result[entity.ID()] = entity
	}
	return result
}

func (w *World) AddEntityListener(listener EntityListener) {
	w.entityListeners = append(w.entityListeners, listener)
}

func (w *World) RemoveEntityListener(listener EntityListener) {
	for i, other := range w.entityListeners {
		if other == listener {
			w.entityListeners[i] = w.entityListeners[len(w.entityListeners)-1]
			w.entityListeners = w.entityListeners[:len(w.entityListeners)-1]
			return
		}
	}
	log.Println("WARN: Attempt to remove entity listener which does not exist.")
}

func (w *World) FireEntityUpdated(id EntityID, entity Entity) {
	for _, listener := range w.entityListeners {
		listener.EntityUpdated(id, entity)
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
