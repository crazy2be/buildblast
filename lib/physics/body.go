package physics

import (
	"errors"

	"buildblast/lib/vmath"
)

type Body struct {
	Pos          vmath.Vec3
	Vel          vmath.Vec3
	Dir          vmath.Vec3
	HalfExtents  vmath.Vec3
	CenterOffset vmath.Vec3
}

func (b *Body) Box() *Box {
	return NewBoxOffset(b.Pos, b.HalfExtents, b.CenterOffset)
}

func CloneBody(body *Body) *Body {
	return &Body{
		body.Pos, body.Vel, body.Dir, body.HalfExtents, body.CenterOffset,
	}
}

// Protocol stuff

func (b *Body) ToProto() []byte {
	buf := make([]byte, 5*3*8)
	buf = append(buf, b.Pos.ToProto())
	buf = append(buf, b.Vel.ToProto())
	buf = append(buf, b.Dir.ToProto())
	buf = append(buf, b.HalfExtents.ToProto())
	buf = append(buf, b.CenterOffset.ToProto())
	return buf
}

func (b *Body) FromProto(buf []byte) (int, error) {
	if len(buf) < 5*3*8 {
		return 0, errors.New("Buffer too small: Body")
	}
	size := 3 * 8
	b.Pos.FromProto(buf[0*size:])
	b.Vel.FromProto(buf[1*size:])
	b.Dir.FromProto(buf[2*size:])
	b.HalfExtents.FromProto(buf[3*size:])
	b.CenterOffset.FromProto(buf[4*size:])
	return 5 * 3 * 8, nil
}
