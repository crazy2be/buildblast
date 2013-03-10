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

func GenerateChunk(cx, cy, cz int, seed float64) Chunk {
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
