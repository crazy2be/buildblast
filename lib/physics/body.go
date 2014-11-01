package physics

import (
	"buildblast/lib/vmath"
)

type Body struct {
	Pos          vmath.Vec3
	Vel          vmath.Vec3
	Dir          vmath.Vec3
	HalfExtents  vmath.Vec3
	CenterOffset vmath.Vec3
}

func (b *Body) GetBox() *Box {
	return NewBoxOffset(b.Pos, b.HalfExtents, b.CenterOffset)
}

func CloneBody(body *Body) *Body {
	return &Body{
		body.Pos, body.Vel, body.Dir, body.HalfExtents, body.CenterOffset,
	}
}
