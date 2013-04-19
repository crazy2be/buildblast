package main

import (
	"log"
	"math"
	"time"

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
	dir       coords.Vec3
	vy        float64
	box       physics.Box
	controls  *ControlState
	history   *PlayerHistory

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
		history: NewPlayerHistory(),
		hp: PLAYER_MAX_HP,
	}
}

func (p *Player) simulateStep(w *World, controls *ControlState) (*MsgPlayerState, *MsgDebugRay) {
	dt := (controls.Timestamp - p.controls.Timestamp) / 1000

	if dt > 1.0 {
		log.Println("WARN: Attempt to simulate step with dt of ", dt, " which is too large. Clipping to 1.0s")
		dt = 1.0
	}
	if dt < 0.0 {
		log.Println("WARN: Attempting to simulate step with negative dt of ", dt, " this is probably wrong.")
	}

	msgDebugRay := p.simulateInventory(dt, w, controls)
	p.simulateMovement(dt, w, controls)

	p.controls = controls
	p.history.Add(controls.Timestamp, p.pos)

	return &MsgPlayerState{
		Pos: p.pos,
		VelocityY: p.vy,
		Timestamp: controls.Timestamp,
		Hp: p.hp,
		ServerTime: time.Now().UnixNano() / 1e6,
	}, msgDebugRay
}

func (p *Player) simulateMovement(dt float64, world *World, controls *ControlState) {
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

func (p *Player) simulateInventory(dt float64, world *World, controls *ControlState) *MsgDebugRay {
	cos := math.Cos
	sin := math.Sin

	lat := controls.Lat
	lon := controls.Lon

	p.dir.X = sin(lat) * cos(lon)
	p.dir.Y = cos(lat)
	p.dir.Z = sin(lat) * sin(lon)

	return p.simulateBlaster(dt, world, controls)
}

func (p *Player) simulateBlaster(dt float64, world *World, controls *ControlState) *MsgDebugRay {
	if !controls.ActivateBlaster {
		return nil
	}

	// Compile a list of player bounding boxes, based on this shooters time
	var players []*physics.Box
	for _, v := range world.players {
		if v == p {
			players = append(players, nil)
			continue
		}
		players = append(players, v.BoxAt(controls.Timestamp))
	}

	target, index := FindIntersection(world, p.pos, p.dir, players)
	if index >= 0 {
		world.players[index].hurt(10)
	}

	if target == nil {
		return nil
	}

	return &MsgDebugRay{
		Pos: *target,
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
