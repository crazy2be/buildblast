package main

import (
	"math"
)

func floor(n float64) int {
	return int(math.Floor(n));
}

func mod(a, b int) int {
	return ((a % b) + b) % b
}

type Vec3 struct {
	X float64
	Y float64
	Z float64
}

func readVec3(pl map[string]interface{}) Vec3 {
	return Vec3{
		X: pl["x"].(float64),
		Y: pl["y"].(float64),
		Z: pl["z"].(float64),
	}
}

type WorldCoords struct {
	X float64
	Y float64
	Z float64
}

func readWorldCoords(pl map[string]interface{}) WorldCoords {
	return WorldCoords(readVec3(pl))
}

func (wc WorldCoords) Chunk() ChunkCoords {
	return ChunkCoords{
		X: floor(wc.X / float64(CHUNK_WIDTH)),
		Y: floor(wc.Y / float64(CHUNK_HEIGHT)),
		Z: floor(wc.Z / float64(CHUNK_DEPTH)),
	}
}

func (wc WorldCoords) Offset() OffsetCoords {
	return OffsetCoords{
		X: mod(floor(wc.X), CHUNK_WIDTH),
		Y: mod(floor(wc.Y), CHUNK_HEIGHT),
		Z: mod(floor(wc.Z), CHUNK_DEPTH),
	}
}

func (wc WorldCoords) toMap() map[string]interface{} {
	m := make(map[string]interface{})
	m["x"] = wc.X
	m["y"] = wc.Y
	m["z"] = wc.Z
	return m
}

type ChunkCoords struct {
	X int
	Y int
	Z int
}

func (cc ChunkCoords) toMap() map[string]interface{} {
	m := make(map[string]interface{})
	m["x"] = cc.X
	m["y"] = cc.Y
	m["z"] = cc.Z
	return m
}

type OffsetCoords struct {
	X int
	Y int
	Z int
}
