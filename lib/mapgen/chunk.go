package mapgen

import (
	"fmt"

	"buildblast/lib/coords"
)

type Chunk struct {
	blocks [coords.BlocksPerChunk]Block
}

func GenerateChunk(generator blockGenerator, cc coords.Chunk) *Chunk {
	chunk := &Chunk{}
	for oc := range coords.EveryOffset() {
		bc := oc.Block(cc)
		block := generator.Block(bc)
		chunk.SetBlock(oc, block)
	}
	return chunk
}

func (c *Chunk) Block(oc coords.Offset) Block {
	return c.blocks[oc.Index()]
}

func (c *Chunk) SetBlock(oc coords.Offset, newBlock Block) {
	c.blocks[oc.Index()] = newBlock
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
func (c *Chunk) Flatten() string {
	data := make([]byte, coords.BlocksPerChunk)
	for i := 0; i < coords.BlocksPerChunk; i++ {
		// 35: # charater. Control charaters are not allowed in JSON
		// strings, and we want to avoid '"', which requires escaping.
		value := byte(c.blocks[i] + 35)
		if value >= 127 || value < 35 {
			panic(fmt.Sprintf("Attempted to encode out of range value of '%d' to chunk data. (It might work but we need to test it)", value))
		}
		data[i] = value
	}
	return string(data)
}

// TODO: Is this function needed?
func (c *Chunk) Clone() *Chunk {
	newChunk := &Chunk{}
	for i := 0; i < coords.BlocksPerChunk; i++ {
		newChunk.blocks[i] = c.blocks[i]
	}
	return newChunk
}
