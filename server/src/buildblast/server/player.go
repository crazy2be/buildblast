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

func NewPlayer() *Player {
	return &Player{
		pos: coords.World{
			X: 0,
			Y: 22,
			Z: 0,
		},
	}
}

func (p *Player) simulateStep(c *Client, dt time.Duration) {
	var controls *ControlState
	select {
		case controls = <-c.ControlState:
		default: return
	}

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

	move := coords.Vec3{
		X: -cos(controls.Lon) * fw + sin(controls.Lon) * rt,
		Y: p.vy * sec,
		Z: -sin(controls.Lon) * fw - cos(controls.Lon) * rt,
	}
	box := physics.NewBoxOffset(p.pos, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET)
	move = box.AttemptMove(c.world, move)
	log.Println("Moving client", c.name, "by", move ,"(currently at ", p.pos, ")")
	if (move.Y == 0) {
		p.vy = 0
	}
	p.pos.X += move.X
	p.pos.Y += move.Y
	p.pos.Z += move.Z
}
