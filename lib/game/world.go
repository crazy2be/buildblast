package game

import (
	"log"
	"math/rand"

	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
	"buildblast/lib/physics"
)

type World struct {
	seed           float64
	chunks         map[coords.Chunk]*mapgen.Chunk
	spawns         []coords.World
	chunkGenerator *ChunkGenerator

	biotics    []Biotic
	possessors []Possessor
	worldItems []*WorldItem

	blockListeners     genericListenerContainer
	chunkListeners     genericListenerContainer
	bioticListeners    genericListenerContainer
	worldItemListeners genericListenerContainer
}

func NewWorld(generator mapgen.Generator) *World {
	w := new(World)
	w.chunks = make(map[coords.Chunk]*mapgen.Chunk)
	w.spawns = make([]coords.World, 0)

	w.chunkGenerator = NewChunkGenerator(generator)
	// Load the initial chunks
	w.chunkGenerator.QueueChunksNearby(coords.Origin)
	go w.chunkGenerator.Run()

	w.biotics = make([]Biotic, 0)
	w.possessors = make([]Possessor, 0)
	w.worldItems = make([]*WorldItem, 0)

	w.blockListeners = makeGenericListenerContainer()
	w.chunkListeners = makeGenericListenerContainer()
	w.bioticListeners = makeGenericListenerContainer()
	w.worldItemListeners = makeGenericListenerContainer()
	return w
}

func (w *World) Tick(dt int64) {
	w.generationTick()
	for _, s := range w.biotics {
		w.chunkGenerator.QueueChunksNearby(s.Wpos())
	}

	// Check the world item collisions.
	removedWorldItems := make([]*WorldItem, len(w.worldItems))
	for i, wi := range w.worldItems {
		updated, pickedUp := wi.Tick(dt, w)
		if pickedUp {
			removedWorldItems = append(removedWorldItems, wi)
		} else if updated {
			w.worldItems[i] = wi
			w.worldItemListeners.FireEvent("WorldItemUpdated", wi.EntityId(), wi)
		}
	}
	for _, wi := range removedWorldItems {
		w.RemoveEntity(wi)
	}
}

func (w *World) generationTick() {
	for i := 0; i < 10; i++ {
		select {
		case generationResult := <-w.chunkGenerator.Generated:
			log.Println("Generated chunk! ", generationResult)
			cc := generationResult.cc
			chunk := generationResult.chunk

			chunk.Each(func(oc coords.Offset, block mapgen.Block) {
				if block == mapgen.BLOCK_SPAWN {
					w.spawns = append(w.spawns, oc.Block(cc).Center())
				}
			})
			w.chunks[cc] = chunk
			w.chunkListeners.FireEvent("ChunkGenerated", cc, chunk)
		default:
			return
		}
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
	return w.spawns[rand.Intn(l)]
}

func (w *World) Chunk(cc coords.Chunk) *mapgen.Chunk {
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

	w.blockListeners.FireEvent("BlockChanged", bc, block, newBlock)
}

func (w *World) AddEntity(e Entity) {
	switch e.(type) {
	case Biotic:
		w.addBiotic(e.(Biotic))
	case *WorldItem:
		w.addWorldItem(e.(*WorldItem))
	}
	if p, ok := e.(Possessor); ok {
		w.addPossessor(p)
	}
}

func (w *World) RemoveEntity(e Entity) {
	switch e.(type) {
	case Biotic:
		w.removeBiotic(e.(Biotic))
	case *WorldItem:
		w.removeWorldItem(e.(*WorldItem))
	}
	if p, ok := e.(Possessor); ok {
		w.removePossessor(p)
	}
}

func (w *World) addBiotic(s Biotic) {
	w.biotics = append(w.biotics, s)
	s.Respawn(w.findSpawn())

	w.bioticListeners.FireEvent("BioticCreated", s.EntityId(), s)
}

func (w *World) removeBiotic(s Biotic) {
	for i, biotic := range w.biotics {
		if biotic == s {
			w.biotics[i] = w.biotics[len(w.biotics)-1]
			w.biotics = w.biotics[:len(w.biotics)-1]

			w.bioticListeners.FireEvent("BioticRemoved", s.EntityId())
		}
	}
}

func (w *World) DamageBiotic(damager string, amount int, s Biotic) {
	s.Damage(amount)
	if s.Dead() {
		s.Respawn(w.findSpawn())
		w.bioticListeners.FireEvent("BioticDied", s.EntityId(), s, damager)
	} else {
		// Should we fire Damaged events if they
		// end up dying? I dunno. Currently we don't.
		w.bioticListeners.FireEvent("BioticDamaged", s.EntityId(), s)
	}
}

func (w *World) Biotics() map[EntityId]Biotic {
	result := make(map[EntityId]Biotic, len(w.biotics))
	for _, biotic := range w.biotics {
		result[biotic.EntityId()] = biotic
	}
	return result
}

func (w *World) addPossessor(p Possessor) {
	w.possessors = append(w.possessors, p)
}

func (w *World) removePossessor(p Possessor) {
	for i, possessor := range w.possessors {
		if possessor == p {
			w.possessors[i] = w.possessors[len(w.possessors)-1]
			w.possessors = w.possessors[:len(w.possessors)-1]
		}
	}
}

func (w *World) addWorldItem(wi *WorldItem) {
	w.worldItems = append(w.worldItems, wi)
	w.worldItemListeners.FireEvent("WorldItemAdded", wi.EntityId(), wi)
}

func (w *World) removeWorldItem(wi *WorldItem) {
	for i, worldItem := range w.worldItems {
		if worldItem == wi {
			w.worldItems[i] = w.worldItems[len(w.worldItems)-1]
			w.worldItems = w.worldItems[:len(w.worldItems)-1]
			w.worldItemListeners.FireEvent("WorldItemRemoved", wi.EntityId())
		}
	}
}

func (w *World) WorldItems() map[EntityId]*WorldItem {
	result := make(map[EntityId]*WorldItem, len(w.worldItems))
	for _, worldItem := range w.worldItems {
		result[worldItem.EntityId()] = worldItem
	}
	return result
}

func (w *World) FindFirstIntersect(entity Biotic, t float64, ray *physics.Ray) (*coords.World, Biotic) {
	boxes := make([]*physics.Box, len(w.biotics))
	for i, other := range w.biotics {
		if other == entity {
			boxes[i] = nil
		} else {
			boxes[i] = other.BoxAt(t)
		}
	}

	hitPos, hitIndex := ray.FindAnyIntersect(w, boxes)
	hitPosWorld := (*coords.World)(hitPos)
	if hitIndex != -1 {
		return hitPosWorld, w.biotics[hitIndex]
	}
	return hitPosWorld, nil
}
