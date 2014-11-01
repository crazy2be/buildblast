package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
)

// Should be an int someday...
type EntityId string

type EntityKind string

const (
	EntityKindPlayer = EntityKind("player")
	EntityKindWorldItem = EntityKind("worldItem")
)

type Entity interface {
	EntityId() EntityId
	Body() physics.Body
	LastUpdated() float64
	Wpos() coords.World
	Look() coords.Direction
	BoxAt(t float64) *physics.Box
}

type EntityState struct {
	EntityId    EntityId
	Body        physics.Body
	LastUpdated float64
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

type Biotic interface {
	Entity
	Damageable
	Respawnable

	State() BioticState
}

type BioticState struct {
	EntityState EntityState
	Health      Health
}
