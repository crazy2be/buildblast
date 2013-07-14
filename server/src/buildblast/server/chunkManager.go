package main

import (
	"log"
	"sync"

	"buildblast/coords"
)


// Manages the chunks loaded, displayed, etc for a
// single client.
type ChunkManager struct {
	chunks map[coords.Chunk]*ChunkStatus
	mutex sync.Mutex
}

type ChunkStatus struct {
	queued bool
	priority int
	data *MsgChunk
}

func NewChunkManager() *ChunkManager {
	cm := new(ChunkManager)
	cm.chunks = make(map[coords.Chunk]*ChunkStatus, 10)
	return cm
}

func (cm *ChunkManager) display(cc coords.Chunk, priority int) {
	status := cm.chunks[cc]

	if status != nil {
		return
	}

	cm.queue(cc, priority)
}

func (cm *ChunkManager) queue(cc coords.Chunk, priority int) {
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

func (cm *ChunkManager) Top() (cc coords.Chunk, valid bool) {
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

func (cm *ChunkManager) QueueChunksNearby(wc coords.World) {
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
		cm.display(newCC, -dist)
	})

	oc := wc.Offset()
	if oc.Y <= 4 {
		cm.display(occ(cc, 0, -1, 0), 1)
	} else if oc.Y >= 28 {
		cm.display(occ(cc, 0, 1, 0), 1)
	}
}
