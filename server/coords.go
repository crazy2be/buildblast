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
	x float64
	y float64
	z float64
}

func readVec3(pl map[string]interface{}) Vec3 {
	return Vec3{
		x: pl["x"].(float64),
		y: pl["y"].(float64),
		z: pl["z"].(float64),
	}
}

type WorldCoords struct {
	x float64
	y float64
	z float64
}

func readWorldCoords(pl map[string]interface{}) WorldCoords {
	return WorldCoords(readVec3(pl))
}

func (wc WorldCoords) Chunk() ChunkCoords {
	return ChunkCoords{
		x: floor(wc.x / float64(CHUNK_WIDTH)),
		y: floor(wc.y / float64(CHUNK_HEIGHT)),
		z: floor(wc.z / float64(CHUNK_DEPTH)),
	}
}

func (wc WorldCoords) Offset() OffsetCoords {
	return OffsetCoords{
		x: mod(floor(wc.x), CHUNK_WIDTH),
		y: mod(floor(wc.y), CHUNK_HEIGHT),
		z: mod(floor(wc.z), CHUNK_DEPTH),
	}
}

func (wc WorldCoords) toMap() map[string]interface{} {
	m := make(map[string]interface{})
	m["x"] = wc.x
	m["y"] = wc.y
	m["z"] = wc.z
	return m
}

type ChunkCoords struct {
	x int
	y int
	z int
}

func (cc ChunkCoords) toMap() map[string]interface{} {
	m := make(map[string]interface{})
	m["x"] = cc.x
	m["y"] = cc.y
	m["z"] = cc.z
	return m
}

type OffsetCoords struct {
	x int
	y int
	z int
}
