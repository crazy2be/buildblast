package main

import (
	"math"

	"buildblast/coords"
)

const (
	PRECISION = 0.01
	MAX_DIST  = 100.0
)

type Ray struct {
	pos    coords.World
	dir    coords.Vec3
}

func (ray *Ray) dist(to coords.World) float64 {
	return math.Sqrt(
		math.Pow(ray.pos.X - to.X, 2) +
		math.Pow(ray.pos.Y - to.Y, 2) +
		math.Pow(ray.pos.Z - to.Z, 2))
}

func (ray *Ray) move(dist float64) {
	ray.pos.X += dist * ray.dir.X
	ray.pos.Y += dist * ray.dir.Y
	ray.pos.Z += dist * ray.dir.Z
}

func FindIntersection(world *World, player *Player, controls *ControlState) *coords.World {
	cos := math.Cos
	sin := math.Sin

	lat := controls.Lat
	lon := controls.Lon
	rayDir := coords.Vec3{
		X: sin(lat) * cos(lon),
		Y: cos(lat),
		Z: sin(lat) * sin(lon),
	}
	ray := &Ray{
		pos: player.pos,
		dir: rayDir,
	}

	// find our intersection
	for dist := 0.0; dist < MAX_DIST; dist += PRECISION {
		ray.move(PRECISION)
		block := world.Block(ray.pos)
		if block.Solid() {
			return &ray.pos
		}
	}
	return nil
}