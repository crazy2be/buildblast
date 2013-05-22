package mapgen

import (
	"buildblast/coords"
)

type ChunkSource interface {
	Chunk(cc coords.Chunk) Chunk
	Spawn() coords.World
}

type BlockSource interface {
	Block(wc coords.World) Block
}

func GenerateChunk(bg BlockSource, cc coords.Chunk) Chunk {
	cw := coords.CHUNK_WIDTH
	ch := coords.CHUNK_HEIGHT
	cd := coords.CHUNK_DEPTH

	blocks := make([][][]Block, cw)
	for ox := 0; ox < cw; ox++ {
		blocks[ox] = make([][]Block, ch)
		for oy := 0; oy < ch; oy++ {
			blocks[ox][oy] = make([]Block, cd)
			for oz := 0; oz < cd; oz++ {
				wc := coords.World{
					X: float64(ox + cc.X*cw),
					Y: float64(oy + cc.Y*ch),
					Z: float64(oz + cc.Z*cd),
				}
				blocks[ox][oy][oz] = bg.Block(wc)
			}
		}
	}
	return blocks
}
