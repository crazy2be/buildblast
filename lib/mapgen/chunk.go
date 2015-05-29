package mapgen

import (
	"buildblast/lib/coords"
	"fmt"
)

type Chunk struct {
	blocks [coords.BlocksPerChunk]Block
}

func GenerateChunk(generator blockGenerator, cc coords.Chunk) *Chunk {
	chunk := &Chunk{}
	i := 0
	cc.EachBlock(func(oc coords.Offset, bc coords.Block) {
		chunk.blocks[i] = generator.Block(bc)
		i++
	})
	return chunk
}

func (c *Chunk) Block(oc coords.Offset) Block {
	return c.blocks[oc.Index()]
}

func (c *Chunk) SetBlock(oc coords.Offset, newBlock Block) {
	c.blocks[oc.Index()] = newBlock
}

// Calls the given function for each block in the chunk.
func (c *Chunk) Each(cb func(oc coords.Offset, block Block)) {
	i := 0
	coords.EachOffset(func(oc coords.Offset) {
		cb(oc, c.blocks[i])
		i++
	})
}

func (c *Chunk) ToByteArray() []byte {
	data := make([]byte, coords.BlocksPerChunk)
	for i := 0; i < coords.BlocksPerChunk; i++ {
		data[i] = byte(c.blocks[i])
	}

	return data
}

// TODO: Is this function needed?
func (c *Chunk) Clone() *Chunk {
	newChunk := &Chunk{}
	for i := 0; i < coords.BlocksPerChunk; i++ {
		newChunk.blocks[i] = c.blocks[i]
	}
	return newChunk
}
