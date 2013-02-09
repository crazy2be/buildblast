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

type WorldCoords struct {
    x float64
    y float64
    z float64
}

func readWorldCoords(pl map[string]interface{}) WorldCoords {
    return WorldCoords{
        x: pl["x"].(float64),
        y: pl["y"].(float64),
        z: pl["z"].(float64),
    }
}

func (w WorldCoords) Chunk() ChunkCoords {
    return ChunkCoords{
        x: floor(w.x / float64(CHUNK_WIDTH)),
        y: floor(w.y / float64(CHUNK_HEIGHT)),
        z: floor(w.z / float64(CHUNK_DEPTH)),
    }
}

func (w WorldCoords) Offset() OffsetCoords {
    return OffsetCoords{
        x: mod(floor(w.x), CHUNK_WIDTH),
        y: mod(floor(w.y), CHUNK_HEIGHT),
        z: mod(floor(w.z), CHUNK_DEPTH),
    }
}

type ChunkCoords struct {
    x int
    y int
    z int
}

type OffsetCoords struct {
    x int
    y int
    z int
}
