package mapgen

import (
	"fmt"

	"buildblast/lib/coords"
)

type Chunk [][][]Block

func generateChunk(bg blockGenerator, cc coords.Chunk) (Chunk, []coords.World) {
	cw := coords.ChunkWidth
	ch := coords.ChunkHeight
	cd := coords.ChunkDepth

	spawns := make([]coords.World, 0)
	blocks := make([][][]Block, cw)
	for ocX := 0; ocX < cw; ocX++ {
		blocks[ocX] = make([][]Block, ch)
		for ocY := 0; ocY < ch; ocY++ {
			blocks[ocX][ocY] = make([]Block, cd)
			for ocZ := 0; ocZ < cd; ocZ++ {
				bc := coords.Block{
					X: ocX + cc.X*cw,
					Y: ocY + cc.Y*ch,
					Z: ocZ + cc.Z*cd,
				}
				block, isSpawn := bg.Block(bc)
				blocks[ocX][ocY][ocZ] = block
				if isSpawn {
					spawns = append(spawns, bc.Center())
				}
			}
		}
	}
	return blocks, spawns
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
	for ocX := 0; ocX < cw; ocX++ {
		for ocY := 0; ocY < ch; ocY++ {
			for ocZ := 0; ocZ < cd; ocZ++ {
				// 35: # charater. Control charaters
				// are not allowed in JSON strings, and
				// we want to avoid '"', which requires
				// escaping.
				value := byte(c[ocX][ocY][ocZ] + 35)
				if value >= 127 || value < 35 {
					panic(fmt.Sprintf("Attempted to encode out of range value of '%d' to chunk data. (It might work but we need to test it)", value))
				}
				data[ocX*cw*ch+ocY*cw+ocZ] = value
			}
		}
	}
	return string(data)
}

func (c Chunk) Clone() Chunk {
	cw := coords.ChunkWidth
	ch := coords.ChunkHeight
	cd := coords.ChunkDepth

	blocks := make([][][]Block, cw)
	for ocX := 0; ocX < cw; ocX++ {
		blocks[ocX] = make([][]Block, ch)
		for ocY := 0; ocY < ch; ocY++ {
			blocks[ocX][ocY] = make([]Block, cd)
			for ocZ := 0; ocZ < cd; ocZ++ {
				blocks[ocX][ocY][ocZ] = c[ocX][ocY][ocZ]
			}
		}
	}
	return blocks
}
