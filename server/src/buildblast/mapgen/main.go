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

