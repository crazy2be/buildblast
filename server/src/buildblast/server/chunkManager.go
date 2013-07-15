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

	highest := -10000
	var highestCC coords.Chunk
	for cc, status := range cm.chunks {
		if status.priority > highest &&
			!status.sent && status.data != nil {
			highest = status.priority
			highestCC = cc
		}
	}
	if highest > -10000 {
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

	occ := func (cc coords.Chunk, x, y, z int) coords.Chunk {
		return coords.Chunk{
			X: cc.X + x,
			Y: cc.Y + y,
			Z: cc.Z + z,
		}
	}

	eachWithin := func (cc coords.Chunk, xdist, ydist, zdist int, cb func (newCC coords.Chunk, dist int)) {
		abs := func (n int) int {
			if n < 0 {
				return -n
			}
			return n
		}
		dist := func (x, y, z int) int {
			return abs(x) + abs(y) + abs(z)
		}

		cb(cc, 0)
		for x := -xdist; x <= xdist; x++ {
			for y := -ydist; y <= ydist; y++ {
				for z := -zdist; z <= zdist; z++ {
					cb(occ(cc, x, y, z), dist(x, y, z))
				}
			}
		}
	}

	cc := wc.Chunk()
	eachWithin(cc, 2, 0, 2, func (newCC coords.Chunk, dist int) {
		cm.queue(w, newCC, -dist)
	})

	oc := wc.Offset()
	if oc.Y <= 4 {
		cm.queue(w, occ(cc, 0, -1, 0), 1)
	} else if oc.Y >= 28 {
		cm.queue(w, occ(cc, 0, 1, 0), 1)
	}
}
