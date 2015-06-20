package maps

import (
	"math"

	"buildblast/server/lib/coords"
	"buildblast/server/lib/mapgen"
	"buildblast/server/lib/mapgen/noise"
)

type MazeArena struct {
	seed float64
}

func NewMazeArena(seed float64) *MazeArena {
	fa := new(MazeArena)
	fa.seed = seed
	return fa
}

func (fa *MazeArena) Block(bc coords.Block) mapgen.Block {
	if bc.X >= 32 || bc.X < -32 ||
		bc.Z >= 128 || bc.Z < -128 ||
		bc.Y < 16 {
		return mapgen.BLOCK_DIRT
	}

	val := noise.Perlin(float64(bc.X)/16, float64(bc.Z)/16, fa.seed)
	isWall := val-math.Floor(val) < 0.05

	if bc.Y == 21 && isWall {
		return mapgen.BLOCK_SPAWN
	}

	if bc.Y < 20 && isWall {
		return mapgen.BLOCK_STONE
	}
	return mapgen.BLOCK_AIR
}

func (fa *MazeArena) Chunk(cc coords.Chunk) *mapgen.Chunk {
	return mapgen.GenerateChunk(fa, cc)
}
