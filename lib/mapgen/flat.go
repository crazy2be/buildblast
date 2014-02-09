package mapgen

import (
	"buildblast/lib/coords"
)

type FlatWorld struct{}

// Take seed to be consistent with all the other world types
func NewFlatWorld(seed float64) *FlatWorld {
	_ = seed
	return new(FlatWorld)
}

func (fw *FlatWorld) Block(bc coords.Block) Block {
	if bc.X == 0 && bc.Y == 16 && bc.Z == 0 {
		return BLOCK_SPAWN
	}
	if bc.Y < 16 {
		return BLOCK_DIRT
	}
	if bc.X%4 == 0 && bc.Z%4 == 0 && bc.Y < 17 {
		return BLOCK_STONE
	}
	return BLOCK_AIR
}

func (fw *FlatWorld) Chunk(cc coords.Chunk) *Chunk {
	return generateChunk(fw, cc)
}
