package main

import (
	"log"
	"sync"
)

type ChunkStatus struct {
	queued bool
	priority int
}

type ChunkManager struct {
	chunks map[ChunkCoords]*ChunkStatus
	mutex sync.Mutex
}

func newChunkManager() *ChunkManager {
	cm := new(ChunkManager)
	cm.chunks = make(map[ChunkCoords]*ChunkStatus, 10)
	return cm
}

func (cm *ChunkManager) display(cc ChunkCoords, priority int) {
	cm.mutex.Lock()
	status := cm.chunks[cc]
	cm.mutex.Unlock()

	if status != nil {
		return
	}

	cm.queue(cc, priority)
}

func (cm *ChunkManager) queue(cc ChunkCoords, priority int) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	status := cm.chunks[cc]
	if status != nil {
		log.Println("Got request for chunk at", cc, "to be queued, even though it has already been queued.")
		return
	}

	status = new(ChunkStatus)
	cm.chunks[cc] = status
	status.queued = true
	status.priority = priority
}

func (cm *ChunkManager) top() (cc ChunkCoords, valid bool) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	highest := -1000
	for key, val := range cm.chunks {
		if val.priority > highest && val.queued {
			highest = val.priority
			cc = key
		}
	}
	if highest != -1000 {
		cm.chunks[cc].queued = false
		return cc, true
	}
	return cc, false
}
