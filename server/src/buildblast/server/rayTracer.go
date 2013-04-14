package main

import (
	"buildblast/mapgen"
	"buildblast/coords"
	"buildblast/physics"
)

const (
	PRECISION = 0.01
	MAX_DIST  = 100.0
)

type Ray struct {
	pos    coords.World
	dir    coords.Vec3
}

func (ray *Ray) move(dist float64) {
	ray.pos.X += dist * ray.dir.X
	ray.pos.Y += dist * ray.dir.Y
	ray.pos.Z += dist * ray.dir.Z
}

func FindIntersection(blocks mapgen.BlockSource, pos coords.World, dir coords.Vec3, players []*physics.Box) (*coords.World, int) {
	ray := &Ray{
		pos: pos,
		dir: dir,
	}

	// find our intersection
	for dist := 0.0; dist < MAX_DIST; dist += PRECISION {
		ray.move(PRECISION)
		// Check players for hits
		for i, v := range players {
			if v == nil {
				continue
			}
			if !v.Contains(ray.pos) {
				continue
			}
			return nil, i
		}
		// Check geometry for hits
		block := blocks.Block(ray.pos)
		if block.Solid() {
			return &ray.pos, -1
		}
	}
	return nil, -1
}