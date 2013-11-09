package mapgen

import (
	"buildblast/lib/coords"
)

type FlatWorld struct {}

// Take seed to be consistent with all the other world types
func NewFlatWorld(seed float64) *FlatWorld {
	_ = seed
	return new(FlatWorld)
}

func (fw *FlatWorld) Block(bc coords.Block) (Block, bool) {
	if bc.X == 0 && bc.Y == 16 && bc.Z == 0 {
		return BLOCK_AIR, true
	}
	if bc.Y < 16 {
		return BLOCK_DIRT, false
	}
	return BLOCK_AIR, false
}

func (fw *FlatWorld) Chunk(cc coords.Chunk) (Chunk, []coords.World) {
	return generateChunk(fw, cc)
}
