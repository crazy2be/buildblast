package mapgen

import (
	"buildblast/coords"
)

type Block byte

const (
	BLOCK_NIL  = Block(0)
	BLOCK_AIR  = Block(1)
	BLOCK_DIRT = Block(2)

	// See "Block encoding.txt"

	// Properties
	BLOCK_MINEABLE    = 0x80000000

	// Subtypes
	BLOCK_TRANSPARENT = 0x1
	BLOCK_SOLID       = 0x2
)

var BLOCK_PROPERTIES []uint32 = []uint32 {
	/** NIL    */ 0,
	/** AIR    */ BLOCK_TRANSPARENT,
	/** DIRT   */ BLOCK_SOLID | BLOCK_MINEABLE,
}

func (b Block) Solid() bool {
	return BLOCK_PROPERTIES[b] & 0xF == BLOCK_SOLID;
}

type Chunk [][][]Block

func (c Chunk) Block(oc coords.Offset) Block {
	return c[oc.X][oc.Y][oc.Z]
}

func (c Chunk) SetBlock(oc coords.Offset, newBlock Block) {
	c[oc.X][oc.Y][oc.Z] = newBlock
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
	cw := coords.CHUNK_WIDTH
	ch := coords.CHUNK_HEIGHT
	cd := coords.CHUNK_DEPTH
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
