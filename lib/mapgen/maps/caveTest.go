package maps

import (
	"buildblast/lib/coords"
	"buildblast/lib/mapgen/noise"
	. "buildblast/lib/mapgen"
	"log"
)

type CaveTest struct {
	simplexNoise *noise.SimplexNoise
	heightMap    map[coords.Chunk][][]int
}

func NewCaveTest(seed int64) *CaveTest {
	ct := new(CaveTest)
	ct.simplexNoise = noise.NewSimplexNoise(10, 0.4, seed)
	ct.heightMap = make(map[coords.Chunk][][]int)
	return ct
}

func (ct *CaveTest) heightAt(x, z float64) float64 {
	height := ct.simplexNoise.Noise2(x, z)
	return height*50 + float64(coords.ChunkHeight)/2
}

func (ct *CaveTest) Chunk(cc coords.Chunk) *Chunk {
	chunk := &Chunk{}
	// Build the height map
	hMap := ct.heightMap[cc]
	if hMap == nil {
		hMap = make([][]int, coords.ChunkWidth)
		for x := range hMap {
			hMap[x] = make([]int, coords.ChunkDepth)
			for z := range hMap[x] {
				oc := coords.Offset{X: x, Y: 0, Z: z}
				bc := oc.Block(cc)
				hMap[x][z] = int(ct.heightAt(float64(bc.X), float64(bc.Z)))
			}
		}
		ct.heightMap[cc] = hMap
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

func (ct *CaveTest) Block(bc coords.Block) Block {
	log.Println("I shouldn't be called")
	return ct.block(bc, int(ct.heightAt(float64(bc.X), float64(bc.Z))))
}

func (ct *CaveTest) block(bc coords.Block, height int) Block {
	if bc.X == 0 && bc.Y == 16 && bc.Z == 0 {
		return BLOCK_SPAWN
	}

	if bc.Y == height {
		return BLOCK_GLASS;
	}
	return BLOCK_AIR
}
