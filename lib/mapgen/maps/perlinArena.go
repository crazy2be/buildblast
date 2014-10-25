package maps

import (
	"math"

	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
	"buildblast/lib/mapgen/noise"
)

type PerlinArena struct {
	seed float64
}

func NewPerlinArena(seed float64) *PerlinArena {
	pa := new(PerlinArena)
	pa.seed = seed
	return pa
}

func (pa *PerlinArena) heightAt(x, z float64) float64 {
	quality := 2.0
	height := 0.0

	for i := 0; i < 4; i++ {
		height += noise.Perlin(x/quality, z/quality, pa.seed) * quality
		quality *= 4
	}

	pow := math.Pow
	max := math.Max
	abs := math.Abs

	mult := 0.1 * pow(1.05,
		max(abs(x)-32, 0)+
			max(abs(z)-128, 0))
	height = height*mult + float64(coords.ChunkHeight)/2
	return height
}

func (pa *PerlinArena) Block(bc coords.Block) mapgen.Block {
	height := int(pa.heightAt(float64(bc.X), float64(bc.Z)))
	if height > bc.Y {
		return mapgen.BLOCK_GRASS
	}
	if height == bc.Y {
		return mapgen.BLOCK_SPAWN
	}
	return mapgen.BLOCK_AIR
}

func (pa *PerlinArena) Chunk(cc coords.Chunk) *mapgen.Chunk {
	return mapgen.GenerateChunk(pa, cc)
}
