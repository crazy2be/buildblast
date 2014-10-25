package vmath

import (
	"math"
)

type Vec3 struct {
	X float64
	Y float64
	Z float64
}

func (v Vec3) Length() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z)
}

func (v Vec3) SetLength(newLen float64) Vec3 {
	ratio := newLen / v.Length()
	return Vec3{
		X: v.X * ratio,
		Y: v.Y * ratio,
		Z: v.Z * ratio,
	}
}

func (v Vec3) Translate(dir Vec3, amount float64) Vec3 {
	dir = dir.SetLength(amount)
	return Vec3{
		X: v.X + dir.X,
		Y: v.Y + dir.Y,
		Z: v.Z + dir.Z,
	}
}

// alpha: [0, 1]. How much of "other" should be in
// the result. (alpha of 0 => v, alpha of 1 => other).
func (v Vec3) Lerp(other Vec3, alpha float64) Vec3 {
	return Vec3{
		X: v.X*(1-alpha) + other.X*alpha,
		Y: v.Y*(1-alpha) + other.Y*alpha,
		Z: v.Z*(1-alpha) + other.Z*alpha,
	}
}
