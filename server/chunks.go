package main

import (
	"log"
	"sync"
)

type Block byte

var BLOCK_AIR = Block(1)
var BLOCK_DIRT = Block(2)

type Chunk [][][]Block

var CHUNK_WIDTH = 32
var CHUNK_DEPTH = 32
var CHUNK_HEIGHT = 32

func (c Chunk) Block(oc OffsetCoords) Block {
	return c[oc.x][oc.y][oc.z]
}

func (c Chunk) SetBlock(oc OffsetCoords, newBlock Block) {
	c[oc.x][oc.y][oc.z] = newBlock
}

// Flatten returns the chunk data as a string. It
// can be used for various forms of serialization
// where a valid UTF-8 string is required, and
// efficiency (in terms of size) is not hugely
// important. We use this format for chunk data
// in JSON documents because:
//  a) It's smaller, at least half the size, of a
//     normal JSON array, potentially more.
//     (depending on the contents)
//  b) It's much faster - the go JSON implementation
//     isn't particulilly fast at serializing large
//     arrays of numbers.
func (c Chunk) Flatten() string {
	cw := CHUNK_WIDTH
	ch := CHUNK_HEIGHT
	cd := CHUNK_DEPTH
	data := make([]byte, cw*ch*cd)
	for x := 0; x < cw; x++ {
		for y := 0; y < ch; y++ {
			for z := 0; z < cd; z++ {
				// 32: Space charater. Control charaters
				// are not allowed in JSON strings.
				data[x*cw*ch + y*cw + z] = byte(c[x][y][z]) + 32
			}
		}
	}
	return string(data)
}

func generateChunk(cx, cy, cz int, seed float64) Chunk {
	cw := CHUNK_WIDTH
	ch := CHUNK_HEIGHT
	cd := CHUNK_DEPTH
	hmap := generateHeightMap(cx*cw, cz*cd, cw, cd, seed)

	blocks := make([][][]Block, cw)
	for ox := 0; ox < cw; ox++ {
		blocks[ox] = make([][]Block, ch)
		for oy := 0; oy < ch; oy++ {
			blocks[ox][oy] = make([]Block, cd)
			for oz := 0; oz < cd; oz++ {
				if hmap[ox][oz] > oy + cy*ch {
					blocks[ox][oy][oz] = BLOCK_DIRT
				} else {
					blocks[ox][oy][oz] = BLOCK_AIR
				}
			}
		}
	}
	return blocks
}

type ChunkStatus struct {
	queued bool
	priority int
}

type ChunkManager struct {
	chunks map[ChunkCoords]*ChunkStatus
	mutex sync.Mutex
	messages chan *Message
}

func newChunkManager() *ChunkManager {
	cm := new(ChunkManager)
	cm.chunks = make(map[ChunkCoords]*ChunkStatus, 10)
	cm.messages = make(chan *Message, 10)
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

