package game

import (
	"log"
	"math"
	"fmt"
	"time"

	"buildblast/lib/coords"
    //"buildblast/lib/geom"
	"buildblast/lib/physics"
	"buildblast/lib/observ"
	"buildblast/lib/observT"
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

type Player struct {
	observ.DisposeExposedImpl

	box      physics.Box
	controls ControlState
	history  *HistoryBuffer
	world    *World
	name     string

	inventory *Inventory

	metrics			*Observ_Metrics

	healthObserv	*Observ_Health

    status          *Observ_Status
	
	teamName		*observT.Observ_string
}

func NewPlayer(world *World, name string) *Player {
	player := &Player{
		history:		NewHistoryBuffer(),
		inventory:		NewInventory(),
		world:			world,
		name:			name,
	}
	
	player.metrics = NewObserv_Metrics(player, Metrics {
          	Pos:                    coords.World{},
          	Look:                   coords.Direction{},
          	Vy:                     0.0,
	})
		
	player.healthObserv = NewObserv_Health(player, Health{
        Points: PLAYER_MAX_HP,
        Setter: string("Self"),
    })
    player.status = NewObserv_Status(player, Status{
        StatusFlag:     Status_Alive,
        StatusSetter:   string("Self"),
    })
	player.teamName = observT.NewObserv_string(player, world.NextTeamName())
	
	return player
}

func (p *Player) Metrics() *Observ_Metrics {
	return p.metrics
}

func (p *Player) HealthObserv() *Observ_Health {
	return p.healthObserv
}

func (p *Player) Status() *Observ_Status {
	return p.status
}

func (p *Player) TeamName() *observT.Observ_string {
	return p.teamName
}

func (p *Player) Pos() coords.World {
	return p.Metrics().Get().Pos
}

func (p *Player) Look() coords.Direction {
	return p.Metrics().Get().Look
}

//TODO: Remove these
func (p *Player) Health() int {
	return p.HealthObserv().Get().Points
}

func (p *Player) Dead() bool {
	return p.Health() <= 0
}

func (p *Player) Respawn(pos coords.World) {
	//TODO: I am on the fence of whether this should be now,
	//	or the time the shot that killed us was fired...
	currentTime := float64(time.Now().Unix() * 1000)

	metrics := p.Metrics().Get()
	metrics.Pos = pos
	metrics.Timestamp = currentTime
	p.Metrics().Set(metrics)
	p.HealthObserv().Set(Health{
        Points:     PLAYER_MAX_HP,
        Setter:     "Self",
    })
	p.history.Clear()
	p.history.Add(currentTime, pos)

	//fmt.Println("Pos", pos ,"Respawned at box", p.BoxAt(currentTime + 1))
}

func (p *Player) Vy() float64 {
	return p.Metrics().Get().Vy
}

// Returns the last time this entity's state was updated
// (i.e. by a client sending a control-state packet).
func (p *Player) LastUpdated() float64 {
	return p.controls.Timestamp
}

func (p *Player) ID() string {
	return string(p.name)
}

func (p *Player) Inventory() *Inventory {
	return p.inventory
}

func (p *Player) Tick(w *World) {
    
}

func (p *Player) ClientTick(controls ControlState) *coords.World {
	// First frame
	if p.controls.Timestamp == 0 {
		p.controls = controls
		return nil
	}

	dt := (controls.Timestamp - p.controls.Timestamp) / 1000

	if dt > 1.0 {
		log.Println("WARN: Attempt to simulate step with dt of ", dt, " which is too large. Clipping to 1.0s")
		dt = 1.0
	}
	if dt < 0.0 {
		log.Println("WARN: Attempting to simulate step with negative dt of ", dt, " this is probably wrong.")
	}

	hitPos := p.simulateBlaster(controls)
	p.simulateMovement(dt, controls)

	//We simulate shooting based on ViewTimestamp, so this might be partially inaccurate.
	p.controls = controls
	p.history.Add(controls.Timestamp, p.Pos())

	return hitPos
}

func (p *Player) simulateMovement(dt float64, controls ControlState) {
	//Any changes to metrics will not be reflect in the player until we set
	//	it. This means don't go calling function on yourself that expect
	//	us to have changed stuff, as we don't set metrics until the end
	//	of this function!
	metrics := p.Metrics().Get()
	metrics.Timestamp = controls.Timestamp

	metrics.Vy += dt * -9.81

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
		Y: metrics.Vy * dt,
		Z: -sin(controls.Lon)*fw - cos(controls.Lon)*rt,
	}

	box := p.Box()

	move = box.AttemptMove(p.world, move)

	if move.Y == 0 {
		if controls.Jump {
			metrics.Vy = 6.0
		} else {
			metrics.Vy = 0.0
		}
	}

	metrics.Pos.X += move.X
	metrics.Pos.Y += move.Y
	metrics.Pos.Z += move.Z


	//TODO, maybe pull look out of metrics (which will change lag compensation
	//	client side, so maybe it is not worth it?)
	lat := controls.Lat
	lon := controls.Lon

	metrics.Look.X = sin(lat) * cos(lon)
	metrics.Look.Y = cos(lat)
	metrics.Look.Z = sin(lat) * sin(lon)


	p.Metrics().Set(metrics)
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
	if (shootingLeft && shootingLeftLast) || (shootingRight && shootingRightLast) {
		return nil
	}

	ray := physics.NewRay(p.Pos(), p.Look())
	//We let the user shoot in the past, but they always move in the present.
	hitPos, hitEntity := p.world.FindFirstIntersect(p, controls.ViewTimestamp, ray)
	if hitEntity != nil {
		fmt.Println("Hit", p.name)
        prevHp := hitEntity.HealthObserv().Get().Points
        hitEntity.HealthObserv().Set(Health{
            Points:     prevHp - 40,
            Setter:     string(p.name),
        })
	} else {
		fmt.Println("Missed")
	}
	return hitPos
}

func (p *Player) Box() *physics.Box {
	return physics.NewBoxOffset(
		p.Pos(),
		PLAYER_HALF_EXTENTS,
		PLAYER_CENTER_OFFSET)
}

func (p *Player) BoxAt(t float64) *physics.Box {
	return physics.NewBoxOffset(
		p.history.PositionAt(t),
		PLAYER_HALF_EXTENTS,
		PLAYER_CENTER_OFFSET)
}
