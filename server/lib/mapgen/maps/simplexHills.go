package maps

import (
	"buildblast/server/lib/coords"
	"buildblast/server/lib/mapgen"
	"buildblast/server/lib/mapgen/noise"
)

type SimplexHills struct {
	simplexNoise *noise.Simplex
}

func NewSimplexHills(seed int64) *SimplexHills {
	sh := new(SimplexHills)
	sh.simplexNoise = noise.NewSimplex(4, 0.8, seed)
	return sh
}

func (sh *SimplexHills) heightAt(x, z float64) float64 {
	height := sh.simplexNoise.Noise2(x/128, z/128)
	return height*50 + float64(coords.ChunkHeight)/2
}

func (sh *SimplexHills) Chunk(cc coords.Chunk) *mapgen.Chunk {
	// Build the height map
	hMap := make([][]int, coords.ChunkWidth)
	for x := range hMap {
		hMap[x] = make([]int, coords.ChunkDepth)
		for z := range hMap[x] {
			oc := coords.Offset{X: x, Y: 0, Z: z}
			bc := oc.Block(cc)
			hMap[x][z] = int(sh.heightAt(float64(bc.X), float64(bc.Z)))
		}
	}

	chunk := &mapgen.Chunk{}
	for ocX := 0; ocX < coords.ChunkWidth; ocX++ {
		for ocY := 0; ocY < coords.ChunkHeight; ocY++ {
			for ocZ := 0; ocZ < coords.ChunkDepth; ocZ++ {
				oc := coords.Offset{X: ocX, Y: ocY, Z: ocZ}
				bc := oc.Block(cc)
				block := sh.block(bc, hMap[oc.X][oc.Z])
				chunk.SetBlock(oc, block)
			}
		}
	}
	return chunk
}

func (sh *SimplexHills) block(bc coords.Block, height int) mapgen.Block {
	if bc.X == 0 && bc.Y == 16 && bc.Z == 0 {
		return mapgen.BLOCK_SPAWN
	}

	if bc.Y == height {
		return mapgen.BLOCK_GRASS
	}
	if bc.Y < height-3 {
		return mapgen.BLOCK_STONE
	}
	if height > bc.Y {
		return mapgen.BLOCK_DIRT
	}
	return mapgen.BLOCK_AIR
}
