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
	incoming chan *ControlState
	outgoing chan *MsgPlayerState

	pos       coords.World
	look      coords.Vec3
	vy        float64
	box       physics.Box
	controls  *ControlState
	history   *PlayerHistory
	world     *World
	name      string

	// Gameplay state
	hp        int
}

func NewPlayer(world *World, name string) *Player {
	return &Player{
		incoming: make(chan *ControlState, 10),
		outgoing: make(chan *MsgPlayerState, 10),
		pos: world.generator.Spawn(),
		controls: &ControlState{},
		history: NewPlayerHistory(),
		hp: PLAYER_MAX_HP,
		world: world,
		name: name,
	}
}

func (p *Player) Pos() coords.World {
	return p.pos
}

func (p *Player) ID() string {
	return "player-" + p.name
}

func (p *Player) Tick(w *World) {
	var controls *ControlState
	select {
		case controls = <-p.incoming:
		default: return
	}

	playerStateMsg, _ := p.simulateStep(controls)

	p.outgoing <- playerStateMsg
}

func (p *Player) simulateStep(controls *ControlState) (*MsgPlayerState, *MsgDebugRay) {
	dt := (controls.Timestamp - p.controls.Timestamp) / 1000

	if dt > 1.0 {
		log.Println("WARN: Attempt to simulate step with dt of ", dt, " which is too large. Clipping to 1.0s")
		dt = 1.0
	}
	if dt < 0.0 {
		log.Println("WARN: Attempting to simulate step with negative dt of ", dt, " this is probably wrong.")
	}

	p.updateLook(controls)

	msgDebugRay := p.simulateBlaster(dt, controls)
	p.simulateMovement(dt, controls)

	p.controls = controls
	p.history.Add(controls.Timestamp, p.pos)

	return &MsgPlayerState{
		Pos: p.pos,
		VelocityY: p.vy,
		Timestamp: controls.Timestamp,
		Hp: p.hp,
	}, msgDebugRay
}

func (p *Player) simulateMovement(dt float64, controls *ControlState) {
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

	box := p.Box()

	move = box.AttemptMove(p.world, move)

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

func (p *Player) updateLook(controls *ControlState) {
	cos := math.Cos
	sin := math.Sin

	lat := controls.Lat
	lon := controls.Lon

	p.look.X = sin(lat) * cos(lon)
	p.look.Y = cos(lat)
	p.look.Z = sin(lat) * sin(lon)
}

func (p *Player) simulateBlaster(dt float64, controls *ControlState) *MsgDebugRay {
	if !controls.ActivateBlaster {
		return nil
	}
	// They were holding it down last frame
	if p.controls.ActivateBlaster {
		return nil
	}

	ray := physics.NewRay(p.pos, p.look)
	hitPos, hitEntity := p.world.FindFirstIntersect(p, controls.Timestamp, ray)
	if hitEntity != nil {
		hitEntity.Damage(10, p.name)
	}

	if hitPos == nil {
		return nil
	}

	return &MsgDebugRay{
		Pos: *hitPos,
	}
}

func (p *Player) Box() *physics.Box {
	return physics.NewBoxOffset(
		p.pos,
		PLAYER_HALF_EXTENTS,
		PLAYER_CENTER_OFFSET)
}

func (p *Player) BoxAt(t float64) *physics.Box {
	return physics.NewBoxOffset(
		p.history.PositionAt(t),
		PLAYER_HALF_EXTENTS,
		PLAYER_CENTER_OFFSET)
}

func (p *Player) Damage(dmg int, name string) {
	p.hp -= dmg
	if p.hp <= 0 {
		p.Respawn()
		p.world.announce(name + " killed " + p.name)
	}
}

func (p *Player) Respawn() {
	p.pos = p.world.generator.Spawn()
	p.hp = PLAYER_MAX_HP
	p.history.Clear()
}
