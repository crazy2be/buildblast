package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
)

type Entity interface {
	EntityId()    EntityId
	Body()        *physics.Body
	Wpos()        coords.World
	Look()        coords.Direction

	Tick(w *World)
}

type EntityState struct {
	EntityId  EntityId
	Body      *physics.Body
}

func (es *EntityState) Wpos() coords.World {
	return coords.World(es.Body.Pos)
}

func (es *EntityState) Look() coords.Direction {
	return coords.Direction(es.Body.Dir)
}

type Damageable interface {
	Life() int
	Dead() bool

	Damage(amount int)
}

type Health struct {
	Life int
}

type Respawnable interface {
	Respawn(pos coords.World)
}

type Sprite interface {
	Entity
	Damageable
	Respawnable

	State() SpriteState
	LastUpdated() float64
	BoxAt(t float64) *physics.Box
}

type SpriteState struct {
	EntityState EntityState
	Health      Health
	Timestamp   float64
}

// Should be an int someday...
type EntityId string

type EntityKind string

const (
	EntityKindPlayer = EntityKind("player")
)
