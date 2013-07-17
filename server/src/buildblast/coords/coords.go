package coords

import (
	"math"
	"encoding/binary"
	"hash/fnv"
)

type Vec3 struct {
	X float64
	Y float64
	Z float64
}

func (vec *Vec3) Dist(to *Vec3) float64 {
	dx := vec.X - to.X
	dy := vec.Y - to.Y
	dz := vec.Z - to.Z
	return math.Sqrt(dx*dx + dy*dy + dz*dz)
}

func (vec *Vec3) Length() float64 {
	x := vec.X; y := vec.Y; z := vec.Z
	return math.Sqrt(x*x + y*y + z*z)
}

func (vec *Vec3) SetLength(n float64) {
	mag := vec.Length()
	r := n / mag
	vec.X *= r
	vec.Y *= r
	vec.Z *= r
}

func (vec *Vec3) Add(other *Vec3) {
	vec.X += other.X
	vec.Y += other.Y
	vec.Z += other.Z
}

type World Vec3

func (wc World) Chunk() Chunk {
	floor := func (n float64) int {
		return int(math.Floor(n))
	}
	return Chunk{
		X: floor(wc.X / float64(CHUNK_WIDTH)),
		Y: floor(wc.Y / float64(CHUNK_HEIGHT)),
		Z: floor(wc.Z / float64(CHUNK_DEPTH)),
	}
}

func (wc World) Offset() Offset {
	floor := func (n float64) int {
		return int(math.Floor(n))
	}
	mod := func (a, b int) int {
		return ((a % b) + b) % b
	}
	return Offset{
		X: mod(floor(wc.X), CHUNK_WIDTH),
		Y: mod(floor(wc.Y), CHUNK_HEIGHT),
		Z: mod(floor(wc.Z), CHUNK_DEPTH),
	}
}

func (wc World) Hash() uint32 {
	hash := fnv.New32a()
	temp := make([]byte, 8)

	binary.BigEndian.PutUint64(temp, math.Float64bits(wc.X))
	hash.Write(temp)

	binary.BigEndian.PutUint64(temp, math.Float64bits(wc.Y))
	hash.Write(temp)

	binary.BigEndian.PutUint64(temp, math.Float64bits(wc.Z))
	hash.Write(temp)

	return hash.Sum32()
}

type Chunk struct {
	X int
	Y int
	Z int
}

type Offset struct {
	X int
	Y int
	Z int
}

const (
	CHUNK_WIDTH  = 2
	CHUNK_DEPTH  = 2
	CHUNK_HEIGHT = 2
)

var CHUNK_SIZE Vec3 = Vec3{
	X: CHUNK_WIDTH,
	Y: CHUNK_HEIGHT,
	Z: CHUNK_DEPTH,
}
