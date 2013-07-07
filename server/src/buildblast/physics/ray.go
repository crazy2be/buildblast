package physics

import (
	"buildblast/mapgen"
	"buildblast/coords"
)

const (
	RAY_PRECISION = 0.01
	RAY_MAX_DIST  = 100.0
)

type Ray struct {
	pos coords.World
	dir coords.Direction
}

// direction must be normalized.
func NewRay(pos coords.World, direction coords.Direction) *Ray {
	ray := &Ray{
		pos: pos,
		dir: direction,
	}
	return ray
}

func (ray *Ray) FindAnyIntersect(blocks mapgen.BlockSource, boxes []*Box) (*coords.World, int) {
	for dist := 0.0; dist < RAY_MAX_DIST; dist += RAY_PRECISION {
		ray.pos = ray.pos.Move(ray.dir, RAY_PRECISION)

		for i, v := range boxes {
			if v == nil {
				continue
			}
			if !v.Contains(ray.pos) {
				continue
			}
			return &ray.pos, i
		}

		if blocks.Block(ray.pos.Block()).Solid() {
			return &ray.pos, -1
		}
	}
	return nil, -1
}
