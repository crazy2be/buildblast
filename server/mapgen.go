package main

import (
	"math"
	"math/rand"
)

type ChunkGenerator interface {
	Chunk(cc ChunkCoords) Chunk
}

type BlockGenerator interface {
	Block(wc WorldCoords) Block
}

func GenerateChunk(bg BlockGenerator, cc ChunkCoords) Chunk {
	cw := CHUNK_WIDTH
	ch := CHUNK_HEIGHT
	cd := CHUNK_DEPTH

	blocks := make([][][]Block, cw)
	for ox := 0; ox < cw; ox++ {
		blocks[ox] = make([][]Block, ch)
		for oy := 0; oy < ch; oy++ {
			blocks[ox][oy] = make([]Block, cd)
			for oz := 0; oz < cd; oz++ {
				wc := WorldCoords {
					x: float64(ox + cc.x*cw),
					y: float64(oy + cc.y*ch),
					z: float64(oz + cc.z*cd),
				}
				blocks[ox][oy][oz] = bg.Block(wc)
			}
		}
	}
	return blocks
}

type MazeArenaGenerator struct {
	rand *rand.Rand
	seed float64
}

func NewMazeArenaGenerator(seed float64) *MazeArenaGenerator {
	fa := new(MazeArenaGenerator)
	fa.seed = seed
	return fa
}

func (fa *MazeArenaGenerator) Block(wc WorldCoords) Block {
	if (wc.x >= 32 || wc.x < -32 ||
		wc.z >= 128 || wc.z < -128 ||
		wc.y < 16) {
			return BLOCK_DIRT
	}

	val := PerlinNoise(wc.x / 16, wc.z / 16, fa.seed)
	if wc.y < 20 && val - math.Floor(val) < 0.05 {
		return BLOCK_DIRT
	}

	return BLOCK_AIR
}

func (fa *MazeArenaGenerator) Chunk(cc ChunkCoords) Chunk {
	return GenerateChunk(fa, cc)
}

type TunnelGenerator struct {
	pa *PerlinArenaGenerator
}

func NewTunnelGenerator(seed float64) *TunnelGenerator {
	tg := new(TunnelGenerator)
	tg.pa = NewPerlinArenaGenerator(seed)
	return tg
}

func (tg *TunnelGenerator) Block(wc WorldCoords) Block {

	if (wc.z >= 99 && wc.z <= 101 && wc.y > 14 && wc.y < 20 && wc.x >= -1 && wc.x <= 1) {
		return BLOCK_AIR
	}
	floor := math.Floor
	abs := math.Abs

	height := tg.pa.heightAt(wc.x, wc.z)
	diff := abs(wc.y - height)
	if diff < 5 && abs(floor(height) - height) < 0.5 {
		return BLOCK_AIR
	}
	return BLOCK_DIRT
}

func (tg *TunnelGenerator) Chunk(cc ChunkCoords) Chunk {
	return GenerateChunk(tg, cc)
}
