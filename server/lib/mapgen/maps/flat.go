package maps

import (
	"math/rand"

	"buildblast/server/lib/coords"
	"buildblast/server/lib/mapgen"
)

type FlatWorld struct {
	randGen *rand.Rand
	seed    float64
}

// Take seed to be consistent with all the other world types
func NewFlatWorld(seed float64) *FlatWorld {
	fw := new(FlatWorld)
	fw.seed = seed
	// This is seeded on a per-block basis
	fw.randGen = rand.New(rand.NewSource(0))
	return fw
}

func (fw *FlatWorld) Block(bc coords.Block) mapgen.Block {
	blockSeed := int64(bc.X)
	blockSeed += int64(bc.Y) << 32
	blockSeed += int64(bc.Z) << 16
	blockSeed += int64(fw.seed)
	randGen := rand.New(rand.NewSource(blockSeed))

	if bc.X == 0 && bc.Y == 16 && bc.Z == 0 {
		return mapgen.BLOCK_SPAWN
	}
	if bc.Y < 15 {
		return mapgen.BLOCK_DIRT
	}
	if bc.Y == 15 {
		return mapgen.BLOCK_GRASS
	}
	if bc.X%4 == 0 && bc.Z%4 == 0 && bc.Y < 17 {
		randBlock := 5 + randGen.Int()%9
		return mapgen.Block(randBlock)
	}
	return mapgen.BLOCK_AIR
}

func (fw *FlatWorld) Chunk(cc coords.Chunk) *mapgen.Chunk {
	return mapgen.GenerateChunk(fw, cc)
}

func (fw *FlatWorld) seedRand(bc coords.Block) {
	blockSeed := int64(bc.X)
	blockSeed += int64(bc.Y) << 32
	blockSeed += int64(bc.Z) << 16
	blockSeed += int64(fw.seed)
	fw.randGen.Seed(blockSeed)
}
