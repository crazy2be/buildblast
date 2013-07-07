package mapgen

import (
	"fmt"

	"buildblast/coords"
)

type Chunk [][][]Block

func generateChunk(bg BlockSource, cc coords.Chunk) Chunk {
	cw := coords.ChunkWidth
	ch := coords.ChunkHeight
	cd := coords.ChunkDepth

	blocks := make([][][]Block, cw)
	for ox := 0; ox < cw; ox++ {
		blocks[ox] = make([][]Block, ch)
		for oy := 0; oy < ch; oy++ {
			blocks[ox][oy] = make([]Block, cd)
			for oz := 0; oz < cd; oz++ {
				bc := coords.Block{
					X: ox + cc.X*cw,
					Y: oy + cc.Y*ch,
					Z: oz + cc.Z*cd,
				}
				blocks[ox][oy][oz] = bg.Block(bc)
			}
		}
	}
	return blocks
}

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
	cw := coords.ChunkWidth
	ch := coords.ChunkHeight
	cd := coords.ChunkDepth
	data := make([]byte, cw*ch*cd)
	for ox := 0; ox < cw; ox++ {
		for oy := 0; oy < ch; oy++ {
			for oz := 0; oz < cd; oz++ {
				// 32: Space charater. Control charaters
				// are not allowed in JSON strings.
				value := byte(c[ox][oy][oz] + 32)
				if (value >= 127 || value < 32) {
					panic(fmt.Sprintf("Attempted to encode out of range value of '%d' to chunk data. (It might work but we need to test it)", value))
				}
				data[ox*cw*ch + oy*cw + oz] = value
			}
		}
	}
	return string(data)
}
