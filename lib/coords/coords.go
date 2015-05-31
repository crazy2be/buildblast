package coords

import (
	"math"

	"buildblast/lib/proto"
	"buildblast/lib/vmath"
)

type Direction vmath.Vec3

func (d Direction) ToProto() []byte {
	vec3 := d.Vec3()
	return vec3.ToProto()
}

func (d Direction) Vec3() vmath.Vec3 {
	return vmath.Vec3(d)
}

// World represents a position in the 3d world.
type World vmath.Vec3

func (wc World) ToProto() []byte {
	vec3 := wc.Vec3()
	return vec3.ToProto()
}

func (wc World) Vec3() vmath.Vec3 {
	return vmath.Vec3(wc)
}

func (wc World) Chunk() Chunk {
	block := wc.Block()
	return block.Chunk()
}

func (wc World) Offset() Offset {
	block := wc.Block()
	return block.Offset()
}

func (wc World) Block() Block {
	floor := func(n float64) int {
		return int(math.Floor(n))
	}
	return Block{
		X: floor(wc.X),
		Y: floor(wc.Y),
		Z: floor(wc.Z),
	}
}

// Block represents the coordinates of any block in the world. It represents
// the same units as World, but without any precision (because blocks can only
// exist at integer boundries).
type Block struct {
	X int
	Y int
	Z int
}

func (bc Block) ToProto() []byte {
	buf := make([]byte, 0, 30)
	buf = append(buf, proto.MarshalInt(bc.X)...)
	buf = append(buf, proto.MarshalInt(bc.Y)...)
	buf = append(buf, proto.MarshalInt(bc.Z)...)
	return buf
}

func (bc *Block) FromProto(buf []byte) (int, error) {
	offset := 0
	var value int64
	var read int
	value, read = proto.UnmarshalInt(buf)
	bc.X = int(value)
	offset += read
	value, read = proto.UnmarshalInt(buf[offset:])
	bc.Y = int(value)
	offset += read
	value, read = proto.UnmarshalInt(buf[offset:])
	bc.Z = int(value)
	offset += read
	return offset, nil
}

func (bc Block) Float64() (float64, float64, float64) {
	return float64(bc.X), float64(bc.Y), float64(bc.Z)
}

func (bc Block) Chunk() Chunk {
	div := func(a, b int) int {
		if a < 0 {
			// By default, integer division in go, like in C,
			// "truncates towards zero". However, we want
			// to floor the result of the division, "truncating
			// towards negative infinity". Hence, we use this
			// crazy snippit. See
			// http://stackoverflow.com/questions/2745074/fast-ceiling-of-an-integer-division-in-c-c
			// http://stackoverflow.com/questions/921180/how-can-i-ensure-that-a-division-of-integers-is-always-rounded-up
			// http://www.cs.nott.ac.uk/~rcb/G51MPC/slides/NumberLogic.pdf
			return -((b - a - 1) / b)
		}
		return a / b
	}
	return Chunk{
		X: div(bc.X, ChunkWidth),
		Y: div(bc.Y, ChunkHeight),
		Z: div(bc.Z, ChunkDepth),
	}
}

func (bc Block) Offset() Offset {
	mod := func(a, b int) int {
		return ((a % b) + b) % b
	}
	return Offset{
		X: mod(bc.X, ChunkWidth),
		Y: mod(bc.Y, ChunkHeight),
		Z: mod(bc.Z, ChunkDepth),
	}
}

func (bc Block) Center() World {
	return World{
		X: float64(bc.X) + 0.5,
		Y: float64(bc.Y) + 0.5,
		Z: float64(bc.Z) + 0.5,
	}
}

type Chunk struct {
	X int
	Y int
	Z int
}

func (cc Chunk) ToProto() []byte {
	buf := make([]byte, 0, 30)
	buf = append(buf, proto.MarshalInt(cc.X)...)
	buf = append(buf, proto.MarshalInt(cc.Y)...)
	buf = append(buf, proto.MarshalInt(cc.Z)...)
	return buf
}

// returns the bottom left block in this chunk
func (cc Chunk) Origin() Block {
	return Block{
		X: cc.X * ChunkWidth,
		Y: cc.Y * ChunkHeight,
		Z: cc.Z * ChunkDepth,
	}
}

// Calls the given function with every valid offset and block coordinate
// in this chunk.
// TODO: Should this give both Offset and Block coordinates or just Block?
func (cc Chunk) EachBlock(cb func(oc Offset, bc Block)) {
	chunkOrigin := cc.Origin()
	for ocX := 0; ocX < ChunkWidth; ocX++ {
		bcX := ocX + chunkOrigin.X
		for ocY := 0; ocY < ChunkHeight; ocY++ {
			bcY := ocY + chunkOrigin.Y
			for ocZ := 0; ocZ < ChunkDepth; ocZ++ {
				bcZ := ocZ + chunkOrigin.Z
				cb(Offset{X: ocX, Y: ocY, Z: ocZ}, Block{X: bcX, Y: bcY, Z: bcZ})
			}
		}
	}
}

type Offset struct {
	X int
	Y int
	Z int
}

func (oc Offset) ToProto() []byte {
	buf := make([]byte, 0, 30)
	buf = append(buf, proto.MarshalInt(oc.X)...)
	buf = append(buf, proto.MarshalInt(oc.Y)...)
	buf = append(buf, proto.MarshalInt(oc.Z)...)
	return buf
}

// Given an integer 0 <= index < BlocksPerChunk, returns the offset
// coordinate for that index in "standard" packed format. This
// logic is duplicated on the client.
func IndexOffset(index int) Offset {
	return Offset{
		X: index / (ChunkWidth * ChunkHeight),
		Y: index / ChunkWidth % ChunkHeight,
		Z: index % ChunkDepth,
	}
}

// Calls the given function with every valid offset coordinate. Useful
// for going through all the blocks in a chunk.
func EachOffset(cb func(oc Offset)) {
	for ocX := 0; ocX < ChunkWidth; ocX++ {
		for ocY := 0; ocY < ChunkHeight; ocY++ {
			for ocZ := 0; ocZ < ChunkDepth; ocZ++ {
				cb(Offset{X: ocX, Y: ocY, Z: ocZ})
			}
		}
	}
}

func (oc Offset) Block(cc Chunk) Block {
	return Block{
		X: oc.X + cc.X*ChunkWidth,
		Y: oc.Y + cc.Y*ChunkHeight,
		Z: oc.Z + cc.Z*ChunkDepth,
	}
}

// Index is the inverse of IndexOffset. Given a chunk offset coordinate,
// it returns the offset into the standard packed chunk representation.
// This logic is duplicated on the client.
func (oc Offset) Index() int {
	return oc.X*ChunkWidth*ChunkHeight +
		oc.Y*ChunkWidth +
		oc.Z
}

const (
	ChunkWidth     = 32
	ChunkHeight    = 32
	ChunkDepth     = 32
	BlocksPerChunk = ChunkWidth * ChunkHeight * ChunkDepth
)

var ChunkSize vmath.Vec3 = vmath.Vec3{
	X: ChunkWidth,
	Y: ChunkHeight,
	Z: ChunkDepth,
}

var Origin World = World{
	X: 0,
	Y: 0,
	Z: 0,
}
