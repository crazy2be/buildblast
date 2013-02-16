// http://mrl.nyu.edu/~perlin/noise/
package main

import (
	"math"
)

var permutation = []int{
	151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
	23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
	174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
	133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
	89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
	202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
	248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
	178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
	14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
	93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
	// Duplicated starting here
	151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
	23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
	174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
	133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
	89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
	202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
	248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
	178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
	14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
	93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
}

func fade(t float64) float64 {
	return t * t * t * (t * (t * 6 - 15) + 10)
}

func lerp(t, a, b float64) float64 {
	return a + t * (b - a)
}

func grad(hash int, x, y, z float64) float64 {
	h := hash & 15

	u := 0.0
	if h < 8 {
		u = x
	} else {
		u = y
	}

	v := 0.0
	if (h < 4) {
		v = y
	} else {
		if (h == 12 || h == 14) {
			v = x
		} else {
			v = z
		}
	}

	r := 0.0
	if ((h & 1) == 0) {
		r += u
	} else {
		r -= u
	}
	if ((h & 2) == 0) {
		r += v
	} else {
		r -= v
	}

	return r
}

func noise(x, y, z float64) float64 {
	floorX := math.Floor(x)
	floorY := math.Floor(y)
	floorZ := math.Floor(z)

	X := int(floorX) & 255
	Y := int(floorY) & 255
	Z := int(floorZ) & 255

	x -= floorX
	y -= floorY
	z -= floorZ

	u := fade(x)
	v := fade(y)
	w := fade(z)

	p := permutation

	A  := p[X] + Y
	AA := p[A] + Z
	AB := p[A + 1] + Z
	B  := p[X + 1] + Y
	BA := p[B] + Z
	BB := p[B + 1] + Z

	return lerp(w,
		lerp(v,
			lerp(u,
				grad(p[AA], x, y, z),
				grad(p[BA], x - 1, y, z),
			),
			lerp(u,
				grad(p[AB], x, y - 1, z),
				grad(p[BB], x - 1, y - 1, z),
			),
		),
		lerp(v,
			lerp(u,
				grad(p[AA + 1], x, y, z - 1),
				grad(p[BA + 1], x - 1, y, z - 1),
			),
			lerp(u,
				grad(p[AB + 1], x, y - 1, z - 1),
				grad(p[BB + 1], x - 1, y - 1, z - 1),
			),
		),
	)
}

func generateHeightMap(xs, zs, xd, zd int, seed float64) [][]int {
	hmap := make([][]float64, xd)
	quality := 2.0

	for x := 0; x < xd; x++ {
		hmap[x] = make([]float64, zd)
		for z := 0; z < zd; z++ {
			hmap[x][z] = 0
		}
	}

	for i := 0; i < 4; i++ {
		for x := 0; x < xd; x++ {
			for z := 0; z < zd; z++ {
				wx := float64(xs + x)
				wz := float64(zs + z)
				hmap[x][z] = noise(wx / quality, wz / quality, seed) * quality
			}
		}
		quality *= 4
	}

	intHMap := make([][]int, xd)
	for x := 0; x < xd; x++ {
		intHMap[x] = make([]int, zd)
		for z := 0; z < zd; z++ {
			mult := 0.1 * math.Pow(1.1,
				math.Max(math.Abs(float64(x + xs)) - 32, 0) +
				math.Max(math.Abs(float64(z + zs)) - 128, 0))
			intHMap[x][z] = int(hmap[x][z] * mult)
		}
	}

	return intHMap
}

type Chunk [][][]Block

func (c Chunk) Block(oc OffsetCoords) Block {
	return c[oc.x][oc.y][oc.z]
}

func (c Chunk) SetBlock(oc OffsetCoords, newBlock Block) {
	c[oc.x][oc.y][oc.z] = newBlock
}

func (c Chunk) Flatten() []Block {
	cw := CHUNK_WIDTH
	ch := CHUNK_HEIGHT
	cd := CHUNK_DEPTH
	data := make([]Block, cw*ch*cd)
	for x := 0; x < cw; x++ {
		for y := 0; y < ch; y++ {
			for z := 0; z < cd; z++ {
				data[x*cw*ch + y*cw + z] = c[x][y][z]
			}
		}
	}
	return data
}

type Block int
var BLOCK_AIR = Block(1)
var BLOCK_DIRT = Block(2)

var CHUNK_WIDTH = 16
var CHUNK_DEPTH = 16
var CHUNK_HEIGHT = 16

func generateChunk(cx, cy, cz int, seed float64) Chunk {
	cw := CHUNK_WIDTH
	ch := CHUNK_HEIGHT
	cd := CHUNK_DEPTH
	hmap := generateHeightMap(cx*cw, cz*cd, cw, cd, seed)

	blocks := make([][][]Block, cw)
	for ox := 0; ox < cw; ox++ {
		blocks[ox] = make([][]Block, ch)
		for oy := 0; oy < ch; oy++ {
			blocks[ox][oy] = make([]Block, cd)
			for oz := 0; oz < cd; oz++ {
				if hmap[ox][oz] > oy + cy*ch {
					blocks[ox][oy][oz] = BLOCK_DIRT
				} else {
					blocks[ox][oy][oz] = BLOCK_AIR
				}
			}
		}
	}
	return blocks
}
