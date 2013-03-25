package main

import (
	"math"
)

type PerlinArenaGenerator struct {
	seed float64
}

func NewPerlinArenaGenerator(seed float64) *PerlinArenaGenerator {
	pa := new(PerlinArenaGenerator)
	pa.seed = seed
	return pa
}


func (pa *PerlinArenaGenerator) heightAt(x, z float64) float64 {
	quality := 2.0
	height := 0.0

	for i := 0; i < 4; i++ {
		height += PerlinNoise(x/quality, z/quality, pa.seed) * quality
		quality *= 4
	}

	pow := math.Pow
	max := math.Max
	abs := math.Abs

	mult := 0.1 * pow(1.05,
		max(abs(x) - 32, 0) +
		max(abs(z) - 128, 0))
	height = height*mult + float64(CHUNK_HEIGHT) / 2
	return height
}

func (pa *PerlinArenaGenerator) Block(wc WorldCoords) Block {
	if pa.heightAt(wc.X, wc.Z) > wc.Y {
		return BLOCK_DIRT
	}

	return BLOCK_AIR
}

func (pa *PerlinArenaGenerator) Chunk(cc ChunkCoords) Chunk {
	return GenerateChunk(pa, cc)
}
