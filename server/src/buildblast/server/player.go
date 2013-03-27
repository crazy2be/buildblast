package main

import (
	"log"
	"time"
	"math"

	"buildblast/physics"
	"buildblast/coords"
)

type ControlState struct {
	Forward bool
	Left bool
	Right bool
	Back bool
	Lat float64
	Lon float64
	Timestamp float64
}

var PLAYER_EYE_HEIGHT = 1.6;
var PLAYER_HEIGHT = 1.75;
var PLAYER_BODY_HEIGHT = 1.3;
var PLAYER_DIST_CENTER_EYE = PLAYER_EYE_HEIGHT - PLAYER_BODY_HEIGHT/2;
var PLAYER_HALF_EXTENTS = coords.Vec3{
	0.2,
	PLAYER_HEIGHT / 2,
	0.2,
};
var PLAYER_CENTER_OFFSET = coords.Vec3{
	0,
	-PLAYER_DIST_CENTER_EYE,
	0,
};

type Player struct {
	pos       coords.World
	rot       coords.Vec3
	vy        float64
	box       physics.Box
	controls  ControlState
}

func (p *Player) simulateStep(c *Client, dt time.Duration) {
	controls := <-c.ControlState
	sec := dt.Seconds()

	p.vy += sec * -9.81

	fw := 0.0
	if controls.Forward {
		fw = 1 * sec * 10
	} else if controls.Back {
		fw = -1 * sec * 10
	}

	rt := 0.0
	if controls.Right {
		rt = 1 * sec * 10
	} else if controls.Left {
		rt = -1 * sec * 10
	}

	cos := math.Cos
	sin := math.Sin
	dx := -cos(controls.Lon) * fw + sin(controls.Lon) * rt
	dy := p.vy * sec
	dz := -sin(controls.Lon) * fw - cos(controls.Lon) * rt
	log.Println("Moving client", c.name, "by", dx, dy, dz)
	p.pos.X += dx
// 	p.pos.Y += dy
	p.pos.Z += dz
}
