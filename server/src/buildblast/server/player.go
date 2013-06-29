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
	ActivateLeft    bool
	ActivateRight   bool
	Lat             float64
	Lon             float64

	Timestamp       float64 // In ms
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
	outInv   chan *MsgInventoryState
	inInv    chan *MsgInventoryState

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
	inventory []Item
	itemLeft  int
	itemRight int
}

func NewPlayer(world *World, name string) *Player {
	inv := make([]Item, INV_WIDTH * INV_HEIGHT)
	inv[0] = ITEM_GUN
	inv[1] = ITEM_SHOVEL
	inv[2] = ITEM_DIRT
	inv[3] = ITEM_STONE
	return &Player{
		incoming: make(chan *ControlState, 100),
		outgoing: make(chan *MsgPlayerState, 100),
		outInv: make(chan *MsgInventoryState, 100),
		inInv: make(chan *MsgInventoryState, 100),
		pos: world.generator.Spawn(),
		controls: &ControlState{},
		history: NewPlayerHistory(),
		hp: PLAYER_MAX_HP,
		inventory: inv,
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
	for {
		select {
			case controls := <-p.incoming:
				playerStateMsg, playerInventoryMsg, _ := p.simulateStep(controls)
				p.outgoing <- playerStateMsg
				p.outInv <- playerInventoryMsg
			case inv := <-p.inInv:
				p.itemLeft = inv.ItemLeft
				p.itemRight = inv.ItemRight
			default: return
		}
	}
}

func (p *Player) simulateStep(controls *ControlState) (*MsgPlayerState, *MsgInventoryState, *MsgDebugRay) {
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
	}, &MsgInventoryState{
		Items: ItemsToString(p.inventory),
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
	shootingLeft := controls.ActivateLeft && p.inventory[p.itemLeft].Shootable()
	shootingRight := controls.ActivateRight && p.inventory[p.itemRight].Shootable()
	if !shootingLeft && !shootingRight {
		return nil
	}

	// They were holding it down last frame
	shootingLeftLast := p.controls.ActivateLeft && p.inventory[p.itemLeft].Shootable()
	shootingRightLast := p.controls.ActivateRight && p.inventory[p.itemRight].Shootable()
	if (shootingLeft && shootingLeftLast) || (shootingRight && shootingRightLast) {
		return nil
	}

	ray := physics.NewRay(p.pos, p.look)
	hitPos, hitEntity := p.world.FindFirstIntersect(p, controls.Timestamp, ray)
	if hitEntity != nil {
		p.world.DamageEntity(p.name, 10, hitEntity)
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

func (p *Player) Damage(amount int) {
	p.hp -= amount
}

func (p *Player) Dead() bool {
	return p.hp <= 0
}

func (p *Player) Respawn() {
	p.pos = p.world.generator.Spawn()
	p.hp = PLAYER_MAX_HP
	p.history.Clear()
}
