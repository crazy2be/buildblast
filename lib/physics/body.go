package physics

import (
	"buildblast/lib/vmath"
)

type Body struct {
	Pos vmath.Vec3
	Vel vmath.Vec3
	Dir vmath.Vec3
	Box *Box
}
