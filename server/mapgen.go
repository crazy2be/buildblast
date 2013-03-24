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
					X: float64(ox + cc.X*cw),
					Y: float64(oy + cc.Y*ch),
					Z: float64(oz + cc.Z*cd),
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
	if (wc.X >= 32 || wc.X < -32 ||
		wc.Z >= 128 || wc.Z < -128 ||
		wc.Y < 16) {
			return BLOCK_DIRT
	}

	val := PerlinNoise(wc.X / 16, wc.Z / 16, fa.seed)
	if wc.Y < 20 && val - math.Floor(val) < 0.05 {
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

	if (wc.Z >= 99 && wc.Z <= 101 &&
		wc.Y > 14 && wc.Y < 20 &&
		wc.X >= -1 && wc.X <= 1) {
		return BLOCK_AIR
	}
	floor := math.Floor
	abs := math.Abs

	height := tg.pa.heightAt(wc.X, wc.Z)
	diff := abs(wc.Y - height)
	if diff < 5 && abs(floor(height) - height) < 0.5 {
		return BLOCK_AIR
	}
	return BLOCK_DIRT
}

func (tg *TunnelGenerator) Chunk(cc ChunkCoords) Chunk {
	return GenerateChunk(tg, cc)
}
