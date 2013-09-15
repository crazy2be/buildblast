package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
)

//Is this allowed? Is this another way to say give me anything?
type SynchronizedData interface { }

//Interface currently implemented by Player (not to say anything cannot
//implement it, but for now it is just implemented by player).
type Entity interface {
	Tick(w *World)
	Health() int
	Damage(amount int)
	Dead() bool
	Respawn(pos coords.World)
	BoxAt(t float64) *physics.Box
	Pos() coords.World
	ID() string
	GetTickData() SynchronizedData
}

type EntityListener interface {
	EntityTick(tickData SynchronizedData)
	EntityCreated(id string)
	EntityDied(id string, killer string)
	EntityRemoved(id string)
}