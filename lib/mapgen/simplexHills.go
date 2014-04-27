package mapgen

import (
	"log"
	"buildblast/lib/coords"
	"buildblast/lib/mapgen/noise"
)

type SimplexHills struct {
	simplexNoise *noise.SimplexNoise
	simplexHoles *noise.SimplexNoise
}

func NewSimplexHills(seed int64) *SimplexHills {
	sh := new(SimplexHills)
	sh.simplexNoise = noise.NewSimplexNoise(1024, 0.4, seed)
	sh.simplexHoles = noise.NewSimplexNoise(1024, 0.8, seed)
	return sh
}

func (sh *SimplexHills) heightAt(x, z float64) float64 {
	height := sh.simplexNoise.Noise2(x, z)
	return height*50 + float64(coords.ChunkHeight)/2
}

func (sh *SimplexHills) holeAt(x, y, z float64) bool {
	val := sh.simplexNoise.Noise3(x, y, z)
	return val < -0.2
}

func (sh *SimplexHills) Chunk(cc coords.Chunk) *Chunk {
	chunk := &Chunk{}
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

func (sh *SimplexHills) Block(bc coords.Block) Block {
	log.Println("I shouldn't be called")
	return sh.block(bc, int(sh.heightAt(float64(bc.X), float64(bc.Z))))
}

func (sh *SimplexHills) block(bc coords.Block, height int) Block {
	if bc.X == 0 && bc.Y == 16 && bc.Z == 0 {
		return BLOCK_SPAWN
	}
	if sh.holeAt(float64(bc.X), float64(bc.Y), float64(bc.Z)) {
		return BLOCK_AIR
	}

	if bc.Y == height {
		return BLOCK_GRASS
	}
	if bc.Y < height-3 {
		return BLOCK_STONE
	}
	if height > bc.Y {
		return BLOCK_DIRT
	}
	return BLOCK_AIR
}
