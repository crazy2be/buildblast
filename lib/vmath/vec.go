package vmath

import (
	"errors"
	"math"

	"buildblast/lib/proto"
)

type Vec3 struct {
	X float64
	Y float64
	Z float64
}

func (v *Vec3) Clone() *Vec3 {
	return &Vec3{
		X: v.X,
		Y: v.Y,
		Z: v.Z,
	}
}

func (v *Vec3) Add(other *Vec3) {
	v.X += other.X
	v.Y += other.Y
	v.Z += other.Z
}

func (v *Vec3) Scale(scalar float64) {
	v.X *= scalar
	v.Y *= scalar
	v.Z *= scalar
}

func (v *Vec3) Length() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z)
}

func (v *Vec3) SetLength(newLen float64) {
	v.Scale(newLen / v.Length())
}

func (v *Vec3) Translate(dir *Vec3, amount float64) {
	translation := dir.Clone()
	translation.SetLength(amount)
	v.Add(translation)
}

// alpha: [0, 1]. How much of "other" should be in
// the result. (alpha of 0 => v, alpha of 1 => other).
func (v *Vec3) Lerp(other *Vec3, alpha float64) *Vec3 {
	return &Vec3{
		X: v.X*(1-alpha) + other.X*alpha,
		Y: v.Y*(1-alpha) + other.Y*alpha,
		Z: v.Z*(1-alpha) + other.Z*alpha,
	}
}

func (v *Vec3) To(other *Vec3) *Vec3 {
	return &Vec3{
		X: other.X - v.X,
		Y: other.Y - v.Y,
		Z: other.Z - v.Z,
	}
}

func (v *Vec3) DistTo(other *Vec3) float64 {
	return math.Sqrt(
		(other.X-v.X)*(other.X-v.X) +
			(other.Y-v.Y)*(other.Y-v.Y) +
			(other.Z-v.Z)*(other.Z-v.Z))
}

func (v *Vec3) DistBetween(other *Vec3) float64 {
	return math.Abs(v.DistTo(other))
}

// Protocol stuff

func (v *Vec3) ToProto() []byte {
	buf := make([]byte, 3*8)
	buf = append(buf, proto.MarshalFloat64(v.X)...)
	buf = append(buf, proto.MarshalFloat64(v.Y)...)
	buf = append(buf, proto.MarshalFloat64(v.Z)...)
	return buf
}

func (v *Vec3) FromProto(buf []byte) (int, error) {
	if len(buf) < 3*8 {
		return 0, errors.New("Buffer too small: Vec3")
	}
	v.X = proto.UnmarshalFloat64(buf[0:8])
	v.Y = proto.UnmarshalFloat64(buf[8:16])
	v.Z = proto.UnmarshalFloat64(buf[16:24])
	return 3*8, nil
}
