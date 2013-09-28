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
	ID() string
	Health() int
}

type EntityListener interface {
	EntityTick()
	EntityCreated(entity Entity, id string)
	EntityDied(entity Entity, id string, killer string)
	EntityRemoved(id string)
}
