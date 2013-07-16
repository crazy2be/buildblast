package main

import (
	"log"
	"sync"

	"buildblast/game"
	"buildblast/coords"
	"buildblast/mapgen"
)


// Manages the chunks loaded, displayed, etc for a
// single client.
type ChunkManager struct {
	chunks map[coords.Chunk]ChunkStatus
	mutex sync.Mutex
}

type ChunkStatus struct {
	sent bool
	priority int
	data mapgen.Chunk
}

func NewChunkManager() *ChunkManager {
	cm := new(ChunkManager)
	cm.chunks = make(map[coords.Chunk]ChunkStatus, 10)
	return cm
}

func (cm *ChunkManager) queue(w *game.World, cc coords.Chunk, priority int) {
	status := cm.chunks[cc]
	status.priority = priority
	if status.sent == false && status.data == nil {
		status.data = w.Chunk(cc)
	}
	cm.chunks[cc] = status
}

func (cm *ChunkManager) Top() (cc coords.Chunk, data mapgen.Chunk) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	highest := -1
	var highestCC coords.Chunk
	for cc, status := range cm.chunks {
		if status.priority > highest &&
			!status.sent && status.data != nil {
			highest = status.priority
			highestCC = cc
		}
	}
	if highest > -1 {
		status := cm.chunks[highestCC]
		data := status.data
		status.sent = true
		status.data = nil
		cm.chunks[highestCC] = status
		return highestCC, data
	}
	return coords.Chunk{}, nil
}

// Applies the given block change to the currently queued chunks
// Returns true if the change was applied (the block has not yet been
// sent), false if it should be sent to the client instead (they already
// have the chunk).
// This is needed to avoid sending stale chunks to the client.
func (cm *ChunkManager) ApplyBlockChange(bc coords.Block, b mapgen.Block) bool {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	cc := bc.Chunk()
	status := cm.chunks[cc]
	if status.sent {
		return false
	}
	if status.data == nil {
		log.Println("WARN: Recieved block change for chunk that is not loaded (this probably shouldn't happen?)")
		return false
	}
	oc := bc.Offset()
	status.data.SetBlock(oc, b)
	return true
}

func (cm *ChunkManager) QueueChunksNearby(w* game.World, wc coords.World) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	queue := func (cc coords.Chunk, priority int) {
		cm.queue(w, cc, priority)
	}

	game.EachChunkNearby(wc, queue)
}
