package mapgen

import (
	"math"

	"buildblast/lib/coords"
)

type MazeArena struct {
	seed           float64
}

func NewMazeArena(seed float64) *MazeArena {
	fa := new(MazeArena)
	fa.seed = seed
	return fa
}

func (fa *MazeArena) Block(bc coords.Block) (Block, bool) {
	if (bc.X >= 32 || bc.X < -32 ||
		bc.Z >= 128 || bc.Z < -128 ||
		bc.Y < 16) {
			return BLOCK_DIRT, false
	}

	val := perlinNoise(float64(bc.X) / 16, float64(bc.Z) / 16, fa.seed)
	isWall := val - math.Floor(val) < 0.05

	if bc.Y == 21 && isWall {
		return BLOCK_AIR, true
	}

	if bc.Y < 20 && isWall {
		return BLOCK_STONE, false
	}
	return BLOCK_AIR, false
}

func (fa *MazeArena) Chunk(cc coords.Chunk) (Chunk, []coords.World) {
	return generateChunk(fa, cc)
}
