package game

import (
	"log"
	"sync"
	"time"

	"buildblast/coords"
	"buildblast/mapgen"
)

type ChunkGenerator struct {
	// Chunks are sent to this channel as they are generated
	Generated chan ChunkGenerationResult

	chunks map[coords.Chunk]*ChunkStatus
	mutex sync.Mutex
	generator mapgen.Generator
}

type ChunkGenerationResult struct {
	cc coords.Chunk
	chunk mapgen.Chunk
	spawns []coords.World
}

type ChunkStatus struct {
	queued bool
	priority int
}

func NewChunkGenerator(generator mapgen.Generator) *ChunkGenerator {
	cm := new(ChunkGenerator)
	cm.chunks = make(map[coords.Chunk]*ChunkStatus, 10)
	cm.Generated = make(chan ChunkGenerationResult, 10)
	cm.generator = generator
	return cm
}

func (cm *ChunkGenerator) display(cc coords.Chunk, priority int) {
	status := cm.chunks[cc]

	if status != nil {
		return
	}

	cm.queue(cc, priority)
}

func (cm *ChunkGenerator) queue(cc coords.Chunk, priority int) {
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

func (cm *ChunkGenerator) Top() (cc coords.Chunk, valid bool) {
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

func (cm *ChunkGenerator) QueueChunksNearby(wc coords.World) {
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

func (cm *ChunkGenerator) Run() {
	for {
		<-time.After(time.Second / 10)
		cc, valid := cm.Top()
		if !valid {
			continue
		}

		chunk, spawns := cm.generator.Chunk(cc)
		cm.Generated <- ChunkGenerationResult{
			cc: cc,
			chunk: chunk,
			spawns: spawns,
		}
	}
}
