package mapgen

import (
	"math"

	"buildblast/lib/coords"
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
		height += perlinNoise(x/quality, z/quality, pa.seed) * quality
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

func (pa *PerlinArena) Block(bc coords.Block) (Block, bool) {
	height := int(pa.heightAt(float64(bc.X), float64(bc.Z)))
	if height > bc.Y {
		return BLOCK_DIRT, false
	}
	if height == bc.Y {
		return BLOCK_AIR, true
	}
	return BLOCK_AIR, false
}

func (pa *PerlinArena) Chunk(cc coords.Chunk) (Chunk, []coords.World) {
	return generateChunk(pa, cc)
}