package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
)

// Should be an int someday...
type EntityId string

type EntityKind byte

const (
	EntityKindPlayer = EntityKind(iota)
	EntityKindWorldItem
)

type Entity interface {
	EntityId() EntityId
	Body() physics.Body
	LastUpdated() float64
	Wpos() coords.World
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

type Possessor interface {
	Inventory() *Inventory
	Give(item Item) bool
	Take(item Item) bool

	// Do items in the world gravitate towards this?
	Collects() bool
	// If Collects return true, then Body must return a value
	Body() physics.Body
}

type Respawnable interface {
	Respawn(pos coords.World)
}

type Biotic interface {
	Entity
	Damageable
	Respawnable

	State() *BioticState
}

type BioticState struct {
	EntityState EntityState
	Health      Health
}
