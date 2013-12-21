package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/observ"
	"buildblast/lib/observT"
	"buildblast/lib/physics"
)

//Interface currently implemented by Player (not to say anything cannot
//implement it, but for now it is just implemented by player).
type Entity interface {
	observ.DisposeExposed

	Pos() coords.World
	Look() coords.Direction
	HealthInt() int
	Vy() float64

	Tick(w *World)
	Dead() bool
	Respawn(pos coords.World)
	BoxAt(t float64) *physics.Box
	ID() string

	GetMetrics() *Observ_Metrics
	LastUpdated() float64

	GetHealth() *Observ_Health

	GetStatus() *Observ_Status

	GetTeamName() *observT.Observ_string
}

type Team struct {
	Name   string
	Color  string
	Points int
}

type Health struct {
	Points int
	Setter string
}

//May become a bit field (so we can put slowed, onfire, etc in here)
const (
	Status_Alive = iota
	Status_Dead  = iota
)

type Status struct {
	StatusFlag   int
	StatusSetter string
}

//Pos, speed, look, (size eventually)
type Metrics struct {
	Pos       coords.World
	Look      coords.Direction
	Vy        float64
	Timestamp float64
}
