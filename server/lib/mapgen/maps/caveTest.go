package maps

import (
	"buildblast/server/lib/coords"
	"buildblast/server/lib/mapgen"
	"buildblast/server/lib/mapgen/noise"
	"time"
)

var DEBUG = true

type CaveTest struct {
	simplexNoise  *noise.Simplex
	simplexNoise2 *noise.Simplex
	ridgedFilter  *noise.RidgedMultifractalFilter
}

func NewCaveTest(seed int64) *CaveTest {
	ct := new(CaveTest)
	ct.simplexNoise = noise.NewSimplex(10, 0.4, seed)
	ct.simplexNoise2 = noise.NewSimplex(10, 0.4, seed+time.Now().Unix())
	ct.ridgedFilter = noise.NewRidgedMultifractalFilter(
		1,    // Num octaves
		1.0,  // Offset
		0.05, // Lacunarity (spacing)
		1.0,  // Gain
		1.0)  // H?
	return ct
}

func (ct *CaveTest) heightAt(x, z float64) float64 {
	height := ct.simplexNoise.Noise2(x, z)
	return height*50 + float64(coords.ChunkHeight)/2
}

func (ct *CaveTest) Chunk(cc coords.Chunk) *mapgen.Chunk {
	chunk := &mapgen.Chunk{}
	// Build the height map
	hMap := make([][]int, coords.ChunkWidth)
	for x := range hMap {
		hMap[x] = make([]int, coords.ChunkDepth)
		for z := range hMap[x] {
			oc := coords.Offset{X: x, Y: 0, Z: z}
			bc := oc.Block(cc)
			hMap[x][z] = int(ct.heightAt(float64(bc.X), float64(bc.Z)))
		}
	}
	for ocX := 0; ocX < coords.ChunkWidth; ocX++ {
		for ocY := 0; ocY < coords.ChunkHeight; ocY++ {
			for ocZ := 0; ocZ < coords.ChunkDepth; ocZ++ {
				oc := coords.Offset{X: ocX, Y: ocY, Z: ocZ}
				bc := oc.Block(cc)
				block := ct.block(bc, hMap[oc.X][oc.Z])
				chunk.SetBlock(oc, block)
			}
		}
	}
	return chunk
}

func (ct *CaveTest) block(bc coords.Block, height int) mapgen.Block {
	if bc.X == 0 && bc.Y == 16 && bc.Z == 0 {
		return mapgen.BLOCK_SPAWN
	}

	if bc.Y > height {
		return mapgen.BLOCK_AIR
	}

	// Calculate a cave
	xf, yf, zf := bc.Float64()
	ridge1 := ct.ridgedFilter.Filter(xf, yf, zf, ct.simplexNoise)
	ridge2 := ct.ridgedFilter.Filter(xf, yf, zf, ct.simplexNoise2)
	if ridge1 >= 0.95 {
		ridge1 = 1
	} else {
		ridge1 = 0
	}
	if ridge2 >= 0.95 {
		ridge2 = 1
	} else {
		ridge2 = 0
	}
	if ridge1*ridge2 == 1 {
		if DEBUG {
			return mapgen.BLOCK_STONE
		}
		return mapgen.BLOCK_AIR
	}

	if bc.Y == height {
		if DEBUG {
			return mapgen.BLOCK_GLASS
		}
		return mapgen.BLOCK_GRASS
	}

	if DEBUG {
		return mapgen.BLOCK_AIR
	}
	if bc.Y < height-3 {
		return mapgen.BLOCK_STONE
	}
	if height > bc.Y {
		return mapgen.BLOCK_DIRT
	}

	return mapgen.BLOCK_AIR
}
