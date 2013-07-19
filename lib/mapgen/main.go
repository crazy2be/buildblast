package mapgen

import (
	"buildblast/lib/coords"
)

type Generator interface {
	// Returns chunk data and a list of potential spawns within this chunk.
	Chunk(cc coords.Chunk) (Chunk, []coords.World)
}

type blockGenerator interface {
	Block(bc coords.Block) (block Block, isSpawn bool)
}

type BlockSource interface {
	Block(bc coords.Block) Block
}

