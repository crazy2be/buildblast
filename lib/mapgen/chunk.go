package mapgen

import (
	"fmt"

	"buildblast/lib/coords"
)

type Chunk []Block
const blocksPerChunk = coords.ChunkWidth * coords.ChunkHeight * coords.ChunkDepth

func allocChunk() (Chunk) {
	return make([]Block, blocksPerChunk)
}

func generateChunk(bg blockGenerator, cc coords.Chunk) (Chunk, []coords.World) {
	cw := coords.ChunkWidth
	ch := coords.ChunkHeight
	cd := coords.ChunkDepth

	spawns := make([]coords.World, 0)
	chunk := allocChunk();
	for ocX := 0; ocX < cw; ocX++ {
		for ocY := 0; ocY < ch; ocY++ {
			for ocZ := 0; ocZ < cd; ocZ++ {
				bc := coords.Block{
					X: ocX + cc.X*cw,
					Y: ocY + cc.Y*ch,
					Z: ocZ + cc.Z*cd,
				}
				block, isSpawn := bg.Block(bc)
				chunk.SetBlock(bc.Offset(), block)
				if isSpawn {
					spawns = append(spawns, bc.Center())
				}
			}
		}
	}
	return chunk, spawns
}

func (c Chunk) Block(oc coords.Offset) Block {
	cw := coords.ChunkWidth
	ch := coords.ChunkHeight
	return c[oc.X*cw*ch + oc.Y*cw + oc.Z]
}

func (c Chunk) SetBlock(oc coords.Offset, newBlock Block) {
	cw := coords.ChunkWidth
	ch := coords.ChunkHeight
	c[oc.X*cw*ch + oc.Y*cw + oc.Z] = newBlock
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
	data := make([]byte, blocksPerChunk)
	for i := 0; i < blocksPerChunk; i++ {
		// 35: # charater. Control charaters are not allowed in JSON
		// strings, and we want to avoid '"', which requires escaping.
		value := byte(c[i] + 35)
		if value >= 127 || value < 35 {
			panic(fmt.Sprintf("Attempted to encode out of range value of '%d' to chunk data. (It might work but we need to test it)", value))
		}
		data[i] = value
	}
	return string(data)
}

func (c Chunk) Clone() Chunk {
	newChunk := allocChunk()
	for i := 0; i < blocksPerChunk; i++ {
		newChunk[i] = c[i];
	}
	return newChunk
}
