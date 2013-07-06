package game

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

var PLAYER_HEIGHT = 1.75;
var PLAYER_EYE_HEIGHT = 1.6;
var PLAYER_BODY_HEIGHT = 1.3;
var PLAYER_HALF_EXTENTS = coords.Vec3{
	0.2,
	PLAYER_HEIGHT / 2,
	0.2,
};
var PLAYER_CENTER_OFFSET = coords.Vec3{
	0,
	PLAYER_BODY_HEIGHT/2 - PLAYER_EYE_HEIGHT,
	0,
};

// Gameplay state defaults
var PLAYER_MAX_HP = 100;

type Player struct {
	pos       coords.World
	look      coords.Vec3
	vy        float64
	box       physics.Box
	controls  ControlState
	history   *PlayerHistory
	world     *World
	name      string

	// Gameplay state
	hp        int

	// Inventory
	inventory []Item
	itemLeft  Item
	itemRight Item
}

func NewPlayer(world *World, name string) *Player {
	// 0 -> (w * h) - 1 are the bag slots, 2 more for left equip, and 2 more again for right.
	// [0, w*h - 1] = bag slots
	// [w*h]        = left equip
	// [w*h + 1]    = left reserve
	// [w*h + 2]    = right equip
	// [w*h + 3]    = right reserve
	inv := make([]Item, INV_WIDTH * INV_HEIGHT + 4)
	inv[0] = ITEM_GUN
	inv[1] = ITEM_SHOVEL
	inv[2] = ITEM_DIRT
	inv[3] = ITEM_STONE
	inv[INV_WIDTH * INV_HEIGHT] = ITEM_GUN
	inv[INV_WIDTH * INV_HEIGHT + 2] = ITEM_SHOVEL
	inv[INV_WIDTH * INV_HEIGHT + 3] = ITEM_DIRT

	return &Player{
		pos: world.generator.Spawn(),
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

func (p *Player) Tick(w *World) {}

func (p *Player) SetActiveItems(left, right Item) {
	p.itemLeft = left
	p.itemRight = right
}

func (p *Player) ClientTick(controls ControlState) (coords.World, float64, int, []Item, *coords.World) {
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
	p.history.Add(controls.Timestamp, p.pos)

	return p.pos, p.vy, p.hp, p.inventory, hitPos
}

func (p *Player) simulateMovement(dt float64, controls ControlState) {
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
	return hitPos
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
