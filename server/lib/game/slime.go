package game

import (
	"strconv"
	"time"

	"buildblast/server/lib/coords"
	"buildblast/server/lib/physics"
	"buildblast/server/lib/vmath"
)

var SlimeHalfExtents = vmath.Vec3{
	0.3, 0.3, 0.3,
}

var SLIME_MAX_LIFE = 10

type Slime struct {
	bioticState BioticState
	history     *HistoryBuffer
	world       *World

	lastUpdated float64
}

var globalSlimeId uint64

func NewSlime(world *World) *Slime {
	globalSlimeId++
	return &Slime{
		bioticState: BioticState{
			EntityState: EntityState{
				EntityId: EntityId("slime" + strconv.FormatUint(globalSlimeId, 10)),
				Body: physics.Body{
					HalfExtents: SlimeHalfExtents,
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

func (s *Slime) Tick(dt int64, w *World) bool {
	body := s.Body()
	body.Vel.Y += float64(dt) / 1000 * -9.81

	box := body.Box()
	move := box.AttemptMove(w, body.Vel)
	if move.X == 0 {
		body.Vel.X = 0
	}
	if move.Y == 0 {
		body.Vel.Y = 0
	}
	if move.Z == 0 {
		body.Vel.Z = 0
	}
	body.Pos.Add(&move)
	s.bioticState.EntityState.Body = body
	s.lastUpdated = float64(time.Now().UnixNano()) / 1e6
	s.history.Add(s.LastUpdated(), s.Body())
	return true
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
	return &s.bioticState
}
