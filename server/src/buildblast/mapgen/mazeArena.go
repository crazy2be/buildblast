package mapgen

import (
	"math"
	"math/rand"

	"buildblast/coords"
)
type MazeArena struct {
	seed           float64
	spawnPointKeys []uint32
	spawnPoints    map[uint32]coords.World
}

func NewMazeArena(seed float64) *MazeArena {
	fa := new(MazeArena)
	fa.seed = seed
	fa.spawnPointKeys = make([]uint32, 0)
	fa.spawnPoints = make(map[uint32]coords.World)
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
		// Don't generate spawns next to walls
		if (wc.X >= 31 || wc.X <= -31 ||
			wc.Z >= 127 || wc.Z <= -127) {
			return BLOCK_STONE
		}

		possibleSpawn := coords.World{
			X: wc.X,
			Y: 21,
			Z: wc.Z,
		}
		hash := possibleSpawn.Hash()
		_, contained := fa.spawnPoints[hash]
		if !contained {
			fa.spawnPointKeys = append(fa.spawnPointKeys, hash)
			fa.spawnPoints[hash] = possibleSpawn
		}
		return BLOCK_STONE
	}

	return BLOCK_AIR
}

func (fa *MazeArena) Chunk(cc coords.Chunk) Chunk {
	return GenerateChunk(fa, cc)
}

func (fa *MazeArena) Spawn() coords.World {
	numSpawns := len(fa.spawnPointKeys)
	if numSpawns > 0 {
		// Get a random key value
		key := fa.spawnPointKeys[rand.Intn(numSpawns)]
		return fa.spawnPoints[key]
	}
	return coords.World {
		X: 0,
		Y: 21,
		Z: 0,
	}
}