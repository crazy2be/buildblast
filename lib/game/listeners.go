package game

import (
	"log"
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
)

type BlockListener interface {
	BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block)
}

type ChunkListener interface {
	ChunkGenerated(cc coords.Chunk, data *mapgen.Chunk)
}

type BioticListener interface {
	BioticCreated(id EntityId, biotic Biotic)
	BioticUpdated(id EntityId, biotic Biotic)
	BioticDamaged(id EntityId, biotic Biotic)
	BioticDied(id EntityId, biotic Biotic, killer string)
	BioticRemoved(id EntityId)
}

type WorldItemListener interface {
	WorldItemAdded(id EntityId, worldItem WorldItem)
	WorldItemUpdated(id EntityId, worldItem WorldItem)
	WorldItemRemoved(id EntityId)
}

// genericListenerContainer is essentially a convenience wrapper to
// avoid having to duplicate too much boilerplate code (at least, too
// much boilerplate code with actual logic) in order to add new events.
// It trades type safety for this convenience, however, so be weary
// of exposing it anywhere outside of the object in which it directly
// resides. In particular, it's Add() and Remove() functions should be
// wrapped with simple (one-line) type-checked versions for other
// objects to use.
type genericListenerContainer struct {
	listeners []interface{}
}

func makeGenericListenerContainer() genericListenerContainer {
	return genericListenerContainer{
		listeners: make([]interface{}, 0),
	}
}

func (glc *genericListenerContainer) Add(listener interface{}) {
	for _, other := range glc.listeners {
		if other == listener {
			log.Println("WARN: Attempt to double-add the same listener object twice! (ignored)")
			return
		}
	}
	glc.listeners = append(glc.listeners, listener)
}

func (glc *genericListenerContainer) Remove(listener interface{}) {
	for i, other := range glc.listeners {
		if other == listener {
			glc.listeners[i] = glc.listeners[len(glc.listeners)-1]
			glc.listeners = glc.listeners[:len(glc.listeners)-1]
			return
		}
	}
	log.Println("WARN: Attempt to remove listener which is not listening.")
}

func (glc *genericListenerContainer) FireEvent(name string, args ...interface{}) {
	defer func() {
		r := recover()
		if r == nil {
			// No panic.
			return
		}
		log.Println("ERROR: Attempt to fire event", name, "with args", args, "to genericListenerContainer with listeners", glc.listeners, "caused a run-time panic to occur! You should fix your code, yo. Reported Error:", r)
	}()
	reflectedArgs := make([]reflect.Value, 0)
	for _, arg := range args {
		reflectedArgs = append(reflectedArgs, reflect.ValueOf(arg))
	}
	for _, listener := range glc.listeners {
		fnc := reflect.ValueOf(listener).MethodByName(name)
		if !fnc.IsValid() {
			log.Println("ERROR: Could not call", name, "on registered listener", listener, "- the named function was not found.")
			continue
		}
		if len(reflectedArgs) != fnc.Type().NumIn() {
			log.Println("ERROR: Could not call", name, "on registered listener", listener, "argument count mismatch. Given", len(reflectedArgs), "arguments, function expects", fnc.Type().NumIn(), "arguments.")
			continue
		}
		fnc.Call(reflectedArgs)
	}
}

// These wrapper functions allow code *outside* of world to have
// nice type-checking, while allowing the code *inside* world
// to avoid excessively duplicated logic.

func (w *World) AddBlockListener(listener BlockListener) {
	w.blockListeners.Add(listener)
}

func (w *World) RemoveBlockListener(listener BlockListener) {
	w.blockListeners.Remove(listener)
}

func (w *World) AddChunkListener(listener ChunkListener) {
	w.chunkListeners.Add(listener)
}

func (w *World) RemoveChunkListener(listener ChunkListener) {
	w.chunkListeners.Remove(listener)
}

func (w *World) AddBioticListener(listener BioticListener) {
	w.bioticListeners.Add(listener)
}

func (w *World) RemoveBioticListener(listener BioticListener) {
	w.bioticListeners.Remove(listener)
}

func (w *World) FireBioticUpdated(id EntityId, biotic Biotic) {
	w.bioticListeners.FireEvent("BioticUpdated", id, biotic)
}

func (w *World) AddWorldItemListener(listener WorldItemListener) {
	w.worldItemListeners.Add(listener)
}

func (w *World) RemoveWorldItemListener(listener WorldItemListener) {
	w.worldItemListeners.Remove(listener)
}
