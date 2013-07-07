package mapgen

import (
	"math"
	"math/rand"

	"buildblast/coords"
)
type MazeArena struct {
	seed           float64
	spawnPoints    []coords.World
}

func NewMazeArena(seed float64) *MazeArena {
	fa := new(MazeArena)
	fa.seed = seed
	fa.spawnPoints = make([]coords.World, 0)
	return fa
}

func (fa *MazeArena) Block(bc coords.Block) Block {
	if (bc.X >= 32 || bc.X < -32 ||
		bc.Z >= 128 || bc.Z < -128 ||
		bc.Y < 16) {
			return BLOCK_DIRT
	}

	val := PerlinNoise(float64(bc.X) / 16, float64(bc.Z) / 16, fa.seed)
	isWall := val - math.Floor(val) < 0.05

	if bc.Y == 21 && isWall {
		fa.spawnPoints = append(fa.spawnPoints, bc.Center())
	}

	if bc.Y < 20 && isWall {
		return BLOCK_STONE
	}
	return BLOCK_AIR
}

func (fa *MazeArena) Chunk(cc coords.Chunk) Chunk {
	return GenerateChunk(fa, cc)
}

func (fa *MazeArena) Spawn() coords.World {
	numSpawns := len(fa.spawnPoints)
	if numSpawns == 0 {
		return coords.World {
			X: 0,
			Y: 21,
			Z: 0,
		}
	}
	return fa.spawnPoints[rand.Intn(numSpawns)]
}
