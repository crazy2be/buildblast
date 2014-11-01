package game

import (
	"log"
	"math"

	"buildblast/lib/coords"
	"buildblast/lib/physics"
	"buildblast/lib/vmath"
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

	Timestamp     float64 // In ms
	ViewTimestamp float64
}

const (
	playerHeight    = 1.75
	playerEyeHeight = 0.936 * playerHeight
)

var PlayerHalfExtents = vmath.Vec3{
	0.4,
	playerHeight / 2,
	0.4,
}
var PlayerCenterOffset = vmath.Vec3{
	0,
	playerHeight/2 - playerEyeHeight,
	0,
}

// Gameplay state defaults
var PLAYER_MAX_LIFE = 100

type Player struct {
	bioticState BioticState
	controls    ControlState
	history     *HistoryBuffer
	world       *World
	name        string

	inventory *Inventory
}

func NewPlayer(world *World, name string) *Player {
	return &Player{
		bioticState: BioticState{
			EntityState: EntityState{
				EntityId: EntityId(name),
				Body: physics.Body{
					HalfExtents:  PlayerHalfExtents,
					CenterOffset: PlayerCenterOffset,
				},
			},
			Health: Health{
				Life: PLAYER_MAX_LIFE,
			},
		},
		history:   NewHistoryBuffer(),
		inventory: NewInventory(),
		world:     world,
		name:      name,
	}
}

/**
 * Entity interface
 */

func (p *Player) EntityId() EntityId {
	return EntityId(p.name) // This needs to change...
}

func (p *Player) Body() physics.Body {
	return p.bioticState.EntityState.Body
}

func (p *Player) Wpos() coords.World {
	return p.bioticState.EntityState.Wpos()
}

func (p *Player) Look() coords.Direction {
	return p.bioticState.EntityState.Look()
}

/**
 * Damageable interface
 */

func (p *Player) Life() int {
	return p.bioticState.Health.Life
}

func (p *Player) Dead() bool {
	return p.Life() <= 0
}

func (p *Player) Damage(amount int) {
	p.bioticState.Health.Life -= amount
}

/**
 * Respawnable interface
 */

func (p *Player) Respawn(pos coords.World) {
	p.bioticState.EntityState.Body.Pos = pos.Vec3()
	p.bioticState.Health.Life = PLAYER_MAX_LIFE
	p.history.Clear()
	p.history.Add(p.LastUpdated(), p.Body())
}

/**
 * Biotic interface
 */

func (p *Player) State() BioticState {
	return BioticState{
		EntityState: EntityState{
			EntityId:    p.EntityId(),
			Body:        p.Body(),
			LastUpdated: p.LastUpdated(),
		},
		Health: Health{
			Life: p.Life(),
		},
	}
}

// Returns the last time this entity's state was updated
// (i.e. by a client sending a control-state packet).
func (p *Player) LastUpdated() float64 {
	return p.controls.Timestamp
}

func (p *Player) BoxAt(t float64) *physics.Box {
	return p.history.BodyAt(t).GetBox()
}

/**
 * Other stuff
 */

func (p *Player) Inventory() *Inventory {
	return p.inventory
}

func (p *Player) setBody(body physics.Body) {
	p.bioticState.EntityState.Body = body
}

func (p *Player) ClientTick(controls ControlState) *coords.World {
	// First frame
	if p.controls.Timestamp == 0 {
		p.controls = controls
		return nil
	}

	dt := (controls.Timestamp - p.controls.Timestamp) / 1000

	if dt > 1.0 {
		log.Println("WARN: Attempt to simulate step with dt of ", dt,
			" which is too large. Clipping to 1.0s")
		dt = 1.0
	}
	if dt < 0.0 {
		log.Println("WARN: Attempting to simulate step with negative dt of ", dt,
			" this is probably wrong.")
	}

	p.updateLook(controls)

	hitPos := p.simulateBlaster(controls)
	p.simulateMovement(dt, controls)

	//We simulate shooting based on ViewTimestamp, so this might be partially inaccurate.
	p.controls = controls
	p.history.Add(controls.Timestamp, p.Body())

	p.world.FireBioticUpdated(p.EntityId(), p)

	return hitPos
}

func (p *Player) simulateMovement(dt float64, controls ControlState) {
	body := p.Body()
	body.Vel.Y += dt * -9.81

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

	move := vmath.Vec3{
		X: -cos(controls.Lon)*fw + sin(controls.Lon)*rt,
		Y: body.Vel.Y * dt,
		Z: -sin(controls.Lon)*fw - cos(controls.Lon)*rt,
	}

	box := p.Box()

	move = box.AttemptMove(p.world, move)

	if move.Y == 0 {
		if controls.Jump {
			body.Vel.Y = 6
		} else {
			body.Vel.Y = 0
		}
	}

	body.Pos.X += move.X
	body.Pos.Y += move.Y
	body.Pos.Z += move.Z

	p.setBody(body)
}

func (p *Player) updateLook(controls ControlState) {
	cos := math.Cos
	sin := math.Sin

	lat := controls.Lat
	lon := controls.Lon

	body := p.Body()

	body.Dir.X = sin(lat) * cos(lon)
	body.Dir.Y = cos(lat)
	body.Dir.Z = sin(lat) * sin(lon)

	p.setBody(body)
}

func (p *Player) simulateBlaster(controls ControlState) *coords.World {
	shootingLeft := controls.ActivateLeft && p.inventory.LeftItem().Shootable()
	shootingRight := controls.ActivateRight && p.inventory.RightItem().Shootable()
	if !shootingLeft && !shootingRight {
		return nil
	}

	// They were holding it down last frame
	shootingLeftLast := p.controls.ActivateLeft && p.inventory.LeftItem().Shootable()
	shootingRightLast := p.controls.ActivateRight && p.inventory.RightItem().Shootable()
	// TODO: I'm pretty sure this logic isn't quite correct.
	// We want to prevent "machine gunning" your opponents by simply
	// holding the trigger. But if you're holding left (say), and
	// press right, it should still activate the right side. But
	// this won't. Not really a huge deal, but worth noting.
	// (we can/should fix this logic when we move this code to
	// inventory, an write a unit test for it :D).
	if (shootingLeft && shootingLeftLast) || (shootingRight && shootingRightLast) {
		return nil
	}

	ray := physics.NewRay(p.Body().Pos, p.Body().Dir)
	// We let the user shoot in the past, but they always move in the present.
	hitPos, hitBiotic := p.world.FindFirstIntersect(p, controls.ViewTimestamp, ray)
	if hitBiotic != nil {
		p.world.DamageBiotic(p.name, 40, hitBiotic)
	}
	return hitPos
}

func (p *Player) Box() *physics.Box {
	return physics.NewBoxOffset(
		p.Body().Pos,
		PlayerHalfExtents,
		PlayerCenterOffset)
}
