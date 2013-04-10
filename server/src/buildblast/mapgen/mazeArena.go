package mapgen

import (
	"math"
	"math/rand"

	"buildblast/coords"
)
type MazeArena struct {
	rand *rand.Rand
	seed float64
}

func NewMazeArena(seed float64) *MazeArena {
	fa := new(MazeArena)
	fa.seed = seed
	return fa
}

func (fa *MazeArena) Block(wc coords.World) Block {
	if (wc.X >= 32 || wc.X < -32 ||
		wc.Z >= 128 || wc.Z < -128 ||
		wc.Y < 16) {
			return BLOCK_DIRT
	}

	val := PerlinNoise(wc.X / 16, wc.Z / 16, fa.seed)
	if wc.Y < 20 && val - math.Floor(val) < 0.05 {
		return BLOCK_STONE
	}

	return BLOCK_AIR
}

func (fa *MazeArena) Chunk(cc coords.Chunk) Chunk {
	return GenerateChunk(fa, cc)
}
