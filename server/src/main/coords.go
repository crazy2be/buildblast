package main

import (
	"math"
)

type Vec3 struct {
	X float64
	Y float64
	Z float64
}

type WorldCoords struct {
	X float64
	Y float64
	Z float64
}

func (wc WorldCoords) Chunk() ChunkCoords {
	floor := func (n float64) int {
		return int(math.Floor(n));
	}
	return ChunkCoords{
		X: floor(wc.X / float64(CHUNK_WIDTH)),
		Y: floor(wc.Y / float64(CHUNK_HEIGHT)),
		Z: floor(wc.Z / float64(CHUNK_DEPTH)),
	}
}

func (wc WorldCoords) Offset() OffsetCoords {
	floor := func (n float64) int {
		return int(math.Floor(n));
	}
	mod := func (a, b int) int {
		return ((a % b) + b) % b
	}
	return OffsetCoords{
		X: mod(floor(wc.X), CHUNK_WIDTH),
		Y: mod(floor(wc.Y), CHUNK_HEIGHT),
		Z: mod(floor(wc.Z), CHUNK_DEPTH),
	}
}

type ChunkCoords struct {
	X int
	Y int
	Z int
}

type OffsetCoords struct {
	X int
	Y int
	Z int
}
