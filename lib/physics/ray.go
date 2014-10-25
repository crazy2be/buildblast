package physics

import (
	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
	"buildblast/lib/vmath"
)

const (
	RAY_PRECISION = 0.01
	RAY_MAX_DIST  = 100.0
)

type Ray struct {
	pos vmath.Vec3
	dir vmath.Vec3
}

func NewRay(pos vmath.Vec3, dir vmath.Vec3) *Ray {
	ray := &Ray{
		pos: pos,
		dir: dir,
	}
	return ray
}

func (ray *Ray) FindAnyIntersect(blocks mapgen.BlockSource, boxes []*Box) (*vmath.Vec3, int) {
	pos := ray.pos
	for dist := 0.0; dist < RAY_MAX_DIST; dist += RAY_PRECISION {
		pos = pos.Translate(ray.dir, RAY_PRECISION)

		for i, v := range boxes {
			if v == nil {
				continue
			}
			if !v.Contains(pos) {
				continue
			}
			return &pos, i
		}

		if blocks.Block(coords.World(pos).Block()).Solid() {
			return &pos, -1
		}
	}
	return nil, -1
}
