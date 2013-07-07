package mapgen

import (
	"buildblast/coords"
)

type ChunkSource interface {
	Chunk(cc coords.Chunk) Chunk
	Spawn() coords.World
}

type BlockSource interface {
	Block(bc coords.Block) Block
}

func GenerateChunk(bg BlockSource, cc coords.Chunk) Chunk {
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
