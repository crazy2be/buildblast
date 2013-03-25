package main

type Block byte

const (
	BLOCK_AIR  = Block(1)
	BLOCK_DIRT = Block(2)
)

type Chunk [][][]Block

const (
	CHUNK_WIDTH  = 32
	CHUNK_DEPTH  = 32
	CHUNK_HEIGHT = 32
)

var CHUNK_SIZE Vec3 = Vec3{
	X: CHUNK_WIDTH,
	Y: CHUNK_HEIGHT,
	Z: CHUNK_DEPTH,
}

func (c Chunk) Block(oc OffsetCoords) Block {
	return c[oc.X][oc.Y][oc.Z]
}

func (c Chunk) SetBlock(oc OffsetCoords, newBlock Block) {
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
