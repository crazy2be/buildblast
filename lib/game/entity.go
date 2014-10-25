package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
)

type Entity interface {
	Pos() coords.World
	Vy() float64
	LastUpdated() float64
	State() EntityState

	Tick(w *World)
	Damage(amount int)
	Dead() bool
	Respawn(pos coords.World)
	BoxAt(t float64) *physics.Box
	ID() EntityID
}

type Sprite interface {
	Entity
	Look() coords.Direction
	Health() int
}

type EntityState struct {
	Pos       coords.World
	Look      coords.Direction
	Health    int
	Vy        float64
	Timestamp float64
}

// Should be an int someday...
type EntityID string

type EntityKind string

const (
	EntityKindPlayer = EntityKind("player")
)
