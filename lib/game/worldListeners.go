package game

import (
	"log"

	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
)

type BlockListener interface {
	BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block)
}

type ChunkListener interface {
	ChunkGenerated(cc coords.Chunk, data *mapgen.Chunk)
}

type EntityListener interface {
	EntityCreated(id EntityID, entity Entity)
	EntityUpdated(id EntityID, entity Entity)
	EntityDamaged(id EntityID, entity Entity)
	EntityDied(id EntityID, entity Entity, killer string)
	EntityRemoved(id EntityID)
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

func (w *World) AddChunkListener(listener ChunkListener) {
	w.chunkListeners = append(w.chunkListeners, listener)
}

func (w *World) RemoveChunkListener(listener ChunkListener) {
	for i, other := range w.chunkListeners {
		if other == listener {
			w.chunkListeners[i] = w.chunkListeners[len(w.chunkListeners)-1]
			w.chunkListeners = w.chunkListeners[:len(w.chunkListeners)-1]
			return
		}
	}
	log.Println("WARN: Attempt to remove chunk listener which does not exist.")
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
