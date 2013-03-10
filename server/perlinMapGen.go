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

// http://mrl.nyu.edu/~perlin/noise/
var PerlinArenaGeneratorPermutations = []int{
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

func (pa *PerlinArenaGenerator) fade(t float64) float64 {
	return t * t * t * (t * (t * 6 - 15) + 10)
}

func (pa *PerlinArenaGenerator) lerp(t, a, b float64) float64 {
	return a + t * (b - a)
}

func (pa *PerlinArenaGenerator) grad(hash int, x, y, z float64) float64 {
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

func (pa *PerlinArenaGenerator) noise(x, y, z float64) float64 {
	floorX := math.Floor(x)
	floorY := math.Floor(y)
	floorZ := math.Floor(z)

	X := int(floorX) & 255
	Y := int(floorY) & 255
	Z := int(floorZ) & 255

	x -= floorX
	y -= floorY
	z -= floorZ

	u := pa.fade(x)
	v := pa.fade(y)
	w := pa.fade(z)

	p := PerlinArenaGeneratorPermutations

	A  := p[X] + Y
	AA := p[A] + Z
	AB := p[A + 1] + Z
	B  := p[X + 1] + Y
	BA := p[B] + Z
	BB := p[B + 1] + Z

	return pa.lerp(w,
		pa.lerp(v,
			pa.lerp(u,
				pa.grad(p[AA], x, y, z),
				pa.grad(p[BA], x - 1, y, z),
			),
			pa.lerp(u,
				pa.grad(p[AB], x, y - 1, z),
				pa.grad(p[BB], x - 1, y - 1, z),
			),
		),
		pa.lerp(v,
			pa.lerp(u,
				pa.grad(p[AA + 1], x, y, z - 1),
				pa.grad(p[BA + 1], x - 1, y, z - 1),
			),
			pa.lerp(u,
				pa.grad(p[AB + 1], x, y - 1, z - 1),
				pa.grad(p[BB + 1], x - 1, y - 1, z - 1),
			),
		),
	)
}

func (pa *PerlinArenaGenerator) heightAt(x, z float64) float64 {
	quality := 2.0
	height := 0.0
	
	for i := 0; i < 4; i++ {
		height += pa.noise(x/quality, z/quality, pa.seed) * quality
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
	if pa.heightAt(wc.x, wc.z) > wc.y {
		return BLOCK_DIRT
	}
	
	return BLOCK_AIR
}

func (pa *PerlinArenaGenerator) Chunk(cc ChunkCoords) Chunk {
	return GenerateChunk(pa, cc)
}
