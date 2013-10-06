package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
)

//Interface currently implemented by Player (not to say anything cannot
//implement it, but for now it is just implemented by player).
type Entity interface {
	Pos() coords.World
	Look() coords.Direction
	Health() int
	Vy() float64
	LastUpdated() float64

	Tick(w *World)
	Damage(amount int)
	Dead() bool
	Respawn(pos coords.World)
	BoxAt(t float64) *physics.Box
	ID() EntityID
}

// Should be an int someday...
type EntityID string

type EntityListener interface {
	EntityCreated(id EntityID, entity Entity)
	EntityDamaged(id EntityID, entity Entity)
	EntityDied(id EntityID, entity Entity, killer string)
	EntityRemoved(id EntityID)
}
