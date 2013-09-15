package game

import (
	"log"
	"math"

	"buildblast/lib/coords"
	"buildblast/lib/physics"
)

type ControlState struct {
	Forward       bool
	Left          bool
	Right         bool
	Back          bool
	Jump          bool
	ActivateLeft  bool
	ActivateRight bool
	Lat           float64
	Lon           float64

	Timestamp float64 // In ms
}

var PLAYER_HEIGHT = 1.75
var PLAYER_EYE_HEIGHT = 1.6
var PLAYER_BODY_HEIGHT = 1.3
var PLAYER_HALF_EXTENTS = coords.Vec3{
	0.2,
	PLAYER_HEIGHT / 2,
	0.2,
}
var PLAYER_CENTER_OFFSET = coords.Vec3{
	0,
	PLAYER_BODY_HEIGHT/2 - PLAYER_EYE_HEIGHT,
	0,
}

// Gameplay state defaults
var PLAYER_MAX_HP = 100

//Data which is sent to the client every tick.
type TickData struct {
	ID		 string
	Hp		 int
	Pos      coords.World
	Vy       float64
	Rot		 coords.Vec3
}

type Player struct {
	look     coords.Direction
	
	box      physics.Box
	controls ControlState
	history  *PlayerHistory
	world    *World
	name     string

	// Gameplay state
	inventory *Inventory

	tickData  TickData
}

func NewPlayer(world *World, name string) *Player {
	player := &Player{
		history:   NewPlayerHistory(),
		inventory: NewInventory(),
		world:     world,
		name:      name,
		tickData: TickData{
			Hp: PLAYER_MAX_HP,
		},
	}

	return player;
}

func (p *Player) Pos() coords.World {
	return p.tickData.Pos
}

func (p *Player) ID() string {
	return p.name
}

func (p *Player) Inventory() *Inventory {
	return p.inventory
}

func (p *Player) Tick(w *World) {}

func (p *Player) ClientTick(controls ControlState) (coords.World, float64, int, *coords.World) {
	// First frame
	if p.controls.Timestamp == 0 {
		p.controls = controls
		return p.tickData.Pos, 0.0, p.tickData.Hp, nil
	}

	dt := (controls.Timestamp - p.controls.Timestamp) / 1000

	if dt > 1.0 {
		log.Println("WARN: Attempt to simulate step with dt of ", dt, " which is too large. Clipping to 1.0s")
		dt = 1.0
	}
	if dt < 0.0 {
		log.Println("WARN: Attempting to simulate step with negative dt of ", dt, " this is probably wrong.")
	}

	p.updateLook(controls)

	hitPos := p.simulateBlaster(dt, controls)
	p.simulateMovement(dt, controls)

	p.controls = controls
	p.history.Add(controls.Timestamp, p.tickData.Pos)

	return p.tickData.Pos, p.tickData.Vy, p.tickData.Hp, hitPos
}

func (p *Player) simulateMovement(dt float64, controls ControlState) {
	p.tickData.Vy += dt * -9.81

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
		X: -cos(controls.Lon)*fw + sin(controls.Lon)*rt,
		Y: p.tickData.Vy * dt,
		Z: -sin(controls.Lon)*fw - cos(controls.Lon)*rt,
	}

	box := p.Box()

	move = box.AttemptMove(p.world, move)

	if move.Y == 0 {
		if controls.Jump {
			p.tickData.Vy = 6
		} else {
			p.tickData.Vy = 0
		}
	}

	p.tickData.Pos.X += move.X
	p.tickData.Pos.Y += move.Y
	p.tickData.Pos.Z += move.Z
}

func (p *Player) updateLook(controls ControlState) {
	cos := math.Cos
	sin := math.Sin

	lat := controls.Lat
	lon := controls.Lon

	p.look.X = sin(lat) * cos(lon)
	p.look.Y = cos(lat)
	p.look.Z = sin(lat) * sin(lon)
}

func (p *Player) simulateBlaster(dt float64, controls ControlState) *coords.World {
	shootingLeft := controls.ActivateLeft && p.inventory.LeftItem().Shootable()
	shootingRight := controls.ActivateRight && p.inventory.RightItem().Shootable()
	if !shootingLeft && !shootingRight {
		return nil
	}

	// They were holding it down last frame
	shootingLeftLast := p.controls.ActivateLeft && p.inventory.LeftItem().Shootable()
	shootingRightLast := p.controls.ActivateRight && p.inventory.RightItem().Shootable()
	if (shootingLeft && shootingLeftLast) || (shootingRight && shootingRightLast) {
		return nil
	}

	ray := physics.NewRay(p.tickData.Pos, p.look)
	hitPos, hitEntity := p.world.FindFirstIntersect(p, controls.Timestamp, ray)
	if hitEntity != nil {
		p.world.DamageEntity(p.name, 10, hitEntity)
	}
	return hitPos
}

func (p *Player) Box() *physics.Box {
	return physics.NewBoxOffset(
		p.tickData.Pos,
		PLAYER_HALF_EXTENTS,
		PLAYER_CENTER_OFFSET)
}

func (p *Player) BoxAt(t float64) *physics.Box {
	return physics.NewBoxOffset(
		p.history.PositionAt(t),
		PLAYER_HALF_EXTENTS,
		PLAYER_CENTER_OFFSET)
}

func (p *Player) Health() int {
	return p.tickData.Hp;
}

func (p *Player) Damage(amount int) {
	p.tickData.Hp -= amount
}

func (p *Player) Dead() bool {
	return p.tickData.Hp <= 0
}

func (p *Player) Respawn(pos coords.World) {
	p.tickData.Pos = pos
	p.tickData.Hp = PLAYER_MAX_HP
	p.history.Clear()
}

func (p *Player) GetTickData() SynchronizedData {
	p.tickData.ID = p.name;
	return p.tickData
}