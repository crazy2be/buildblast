package main

import (
	"log"
	"math"

	"buildblast/physics"
	"buildblast/coords"
)

type ControlState struct {
	Forward         bool
	Left            bool
	Right           bool
	Back            bool
	Jump            bool
	ActivateBlaster bool
	Lat             float64
	Lon             float64

	Timestamp float64 // In ms
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

// Gameplay state defaults
var PLAYER_MAX_HP = 100;

type Player struct {
	pos       coords.World
	vy        float64
	box       physics.Box
	controls  *ControlState

	// Gameplay state
	hp        int
}

func NewPlayer() *Player {
	return &Player{
		pos: coords.World{
			X: 0,
			Y: 27,
			Z: 0,
		},
		controls: &ControlState{},
		hp: PLAYER_MAX_HP,
	}
}

func (p *Player) simulateStep(c *Client, w *World) (*MsgPlayerState, *MsgDebugRay) {
	var controls *ControlState
	select {
		case controls = <-c.ControlState:
		default: return nil, nil
	}

	dt := (controls.Timestamp - p.controls.Timestamp) / 1000

	if dt > 1.0 {
		log.Println("WARN: Attempt to simulate step with dt of ", dt, " which is too large. Clipping.")
		dt = 1.0
	}

	p.simulateTick(dt, c.world, controls)
	var msgDebugRay *MsgDebugRay
	if controls.ActivateBlaster {
		target := FindIntersection(c.world, p, controls)
		if target != nil {
			msgDebugRay = &MsgDebugRay{
				Pos: *target,
			}
		}
	}

	p.controls = controls

	return &MsgPlayerState{
		Pos: p.pos,
		VelocityY: p.vy,
		Timestamp: controls.Timestamp,
		Hp: p.hp,
	}, msgDebugRay
}

func (p *Player) simulateTick(dt float64, world *World, controls *ControlState) {
	p.vy += dt * -9.81

	fw := 0.0
	if controls.Forward {
		fw = 1 * dt * 10
	} else if controls.Back {
		fw = -1 * dt * 10
	}

	rt := 0.0
	if controls.Right {
		rt = 1 * dt * 10
	} else if controls.Left {
		rt = -1 * dt * 10
	}

	cos := math.Cos
	sin := math.Sin

	move := coords.Vec3{
		X: -cos(controls.Lon) * fw + sin(controls.Lon) * rt,
		Y: p.vy * dt,
		Z: -sin(controls.Lon) * fw - cos(controls.Lon) * rt,
	}

	box := physics.NewBoxOffset(p.pos, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET)

	move = box.AttemptMove(world, move)

	if (move.Y == 0) {
		if (controls.Jump) {
			p.vy = 6
		} else {
			p.vy = 0
		}
	}

	p.pos.X += move.X
	p.pos.Y += move.Y
	p.pos.Z += move.Z
}

func (p *Player) hurt(dmg int) bool {
	p.hp -= dmg
	return p.dead()
}

func (p *Player) heal(hps int) {
	p.hp += hps
}

func (p *Player) dead() bool {
	return p.hp <= 0
}
