package main

import (
	"sync"

	"buildblast/coords"
	"buildblast/game"
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
	data *MsgChunk
}

func NewChunkManager() *ChunkManager {
	cm := new(ChunkManager)
	cm.chunks = make(map[coords.Chunk]ChunkStatus, 10)
	return cm
}

func (cm *ChunkManager) queue(w *game.World, cc coords.Chunk, priority int) {
	status := cm.chunks[cc]
	status.priority = priority
	if status.data == nil && status.sent == false {
		chunk := w.Chunk(cc)
		if chunk != nil {
			status.data = &MsgChunk{
				CCPos: cc,
				Size: coords.ChunkSize,
				Data: chunk.Flatten(),
			}
		}
	}
	cm.chunks[cc] = status
}

func (cm *ChunkManager) Top() (data *MsgChunk) {
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
		status.sent = true
		cm.chunks[highestCC] = status
		return status.data
	}
	return nil
}

func (cm *ChunkManager) QueueChunksNearby(w* game.World, wc coords.World) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	queue := func (cc coords.Chunk, priority int) {
		cm.queue(w, cc, priority)
	}

	game.EachChunkNearby(wc, queue)
}
