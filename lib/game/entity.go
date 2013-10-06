package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
)

//Interface currently implemented by Player (not to say anything cannot
//implement it, but for now it is just implemented by player).
type Entity interface {
	Tick(w *World)
	Damage(amount int)
	Dead() bool
	Respawn(pos coords.World)
	BoxAt(t float64) *physics.Box
	Vy() float64
	Pos() (coords.World, float64)
	Look() coords.Direction
	ID() EntityID
	Health() int
}

// Should be an int someday...
type EntityID string

type EntityListener interface {
	EntityCreated(id EntityID, entity Entity)
	EntityDamaged(id EntityID, entity Entity)
	EntityDied(id EntityID, entity Entity, killer string)
	EntityRemoved(id EntityID)
}
