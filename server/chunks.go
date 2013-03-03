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

func (c Chunk) Flatten() string {
// 	geussBlock := func (x, y, z) byte {
// 		for xx := 0; xx < qrad; xx++ {
// 			for yy := 0; yy < qrad; yy++ {
// 				for zz := 0; zz < qrad; zz++ {
// 					if (c[x + xx][y + yy)][z + zz] == BLOCK_DIRT) {
// 						return BLOCK_DIRT
// 					}
// 				}
// 			}
// 		}
// 		return BLOCK_AIR
// 	}
	cw := CHUNK_WIDTH // qrad
	ch := CHUNK_HEIGHT // qrad
	cd := CHUNK_DEPTH // qrad
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
	shown bool
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

func (cm *ChunkManager) displayed(cc ChunkCoords) bool {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	status := cm.chunks[cc]
	return status != nil && status.shown
}

func (cm *ChunkManager) display(cc ChunkCoords) {
	cm.mutex.Lock()
	status := cm.chunks[cc]
	cm.mutex.Unlock()

	if status == nil {
		cm.queue(cc)
		return
	} else if !status.shown {
		cm.show(cc)
	}
}

func (cm *ChunkManager) queue(cc ChunkCoords) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	status := cm.chunks[cc]
	if status != nil {
		log.Println("Got request for chunk at", cc, "to be queued, even though it has already been queued.")
		return
	}

	status = new(ChunkStatus)
	cm.chunks[cc] = status
	status.shown = true
	status.queued = true
}

func (cm *ChunkManager) show(cc ChunkCoords) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	status := cm.chunks[cc]
	if status == nil {
		log.Println("Got request for chunk at", cc, "to be shown, even though it was never queued.")
	}

	if status.shown {
		log.Println("Got request for chunk at", cc, "to be shown, even though it has already been shown.")
	}

	status.shown = true

	ms := newMessage("show-chunk")
	ms.Payload["ccpos"] = cc.toMap()

	cm.chunks[cc].shown = true
	cm.messages <- ms
}

func (cm *ChunkManager) hide(cc ChunkCoords) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	status := cm.chunks[cc]
	if status == nil {
		log.Println("Got request for chunk at", cc, "to be hidden, even though it was never queued.")
	}

	if !status.shown {
		log.Println("Got request for chunk at", cc, "to be hidden, even though it is currently hidden!")
	}

	status.shown = false

	ms := newMessage("hide-chunk")
	ms.Payload["ccpos"] = cc.toMap()

	cm.chunks[cc].shown = false
	cm.messages <- ms
}

func (cm *ChunkManager) top() (cc ChunkCoords, valid bool) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	highest := -1000
	for key, val := range cm.chunks {
		if val.priority > highest &&
			val.shown && val.queued {
			highest = val.priority
			cc = key
		}
	}
	if highest > -1000 {
		cm.chunks[cc].queued = false
		return cc, true
	}
	return cc, false
}

