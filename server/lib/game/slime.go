package game

import (
	"buildblast/server/lib/coords"
	"buildblast/server/lib/physics"
	"buildblast/server/lib/vmath"
)

const (
	slimeHeight = 0.6
)

var SlimeHalfExtents = vmath.Vec3{
	0.3, 0.3, 0.3,
}

var SlimeCenterOffset = vmath.Vec3{
	0, 0, 0,
}

var SLIME_MAX_LIFE = 10

type Slime struct {
	bioticState BioticState
	history     *HistoryBuffer
	world       *World

	lastUpdated float64
}

func NewSlime(world *World, id EntityId) *Slime {
	return &Slime{
		bioticState: BioticState{
			EntityState: EntityState{
				EntityId: id,
				Body: physics.Body{
					HalfExtents:  SlimeHalfExtents,
					CenterOffset: SlimeCenterOffset,
				},
			},
			Health: Health{
				Life: SLIME_MAX_LIFE,
			},
		},
		history: NewHistoryBuffer(),
		world:   world,
	}
}

// Entity interface

func (s *Slime) EntityId() EntityId {
	return EntityId(s.bioticState.EntityState.EntityId)
}

func (s *Slime) Body() physics.Body {
	return s.bioticState.EntityState.Body
}

func (s *Slime) LastUpdated() float64 {
	return s.lastUpdated
}

func (s *Slime) Wpos() coords.World {
	return s.bioticState.EntityState.Wpos()
}

func (s *Slime) Look() coords.Direction {
	return s.bioticState.EntityState.Look()
}

func (s *Slime) BoxAt(t float64) *physics.Box {
	return s.history.BodyAt(t).Box()
}

// Damageable interface

func (s *Slime) Life() int {
	return s.bioticState.Health.Life
}

func (s *Slime) Dead() bool {
	return s.Life() <= 0
}

func (s *Slime) Damage(amount int) {
	s.bioticState.Health.Life -= amount
}

// Respawnable interface

func (s *Slime) Respawn(pos coords.World) {
	s.bioticState.EntityState.Body.Pos = pos.Vec3()
	s.bioticState.Health.Life = SLIME_MAX_LIFE
	s.history.Clear()
	s.history.Add(s.LastUpdated(), s.Body())
}

// Biotic interface

func (s *Slime) State() *BioticState {
	return &BioticState{
		EntityState: EntityState{
			EntityId:    s.EntityId(),
			Body:        s.Body(),
			LastUpdated: s.LastUpdated(),
		},
		Health: Health{
			Life: s.Life(),
		},
	}
}
