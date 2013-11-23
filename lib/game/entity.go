package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
	"buildblast/lib/observ"
	"buildblast/lib/observT"
)

//Interface currently implemented by Player (not to say anything cannot
//implement it, but for now it is just implemented by player).
type Entity interface {
	observ.DisposeExposed

	Pos() coords.World
	Look() coords.Direction
	Health() int
	Vy() float64

	Tick(w *World)
	Dead() bool
	Respawn(pos coords.World)
	BoxAt(t float64) *physics.Box
	ID() EntityID
	
	Metrics()		*Observ_Metrics //Metrics
	LastUpdated() 	float64
		
	HealthObserv()	*observ.Observ //Health
	
	Status()		*observ.Observ //Status
	
	TeamName()		*observT.Observ_string //string
}

type Team struct {
	Name	string
	Color	string
	Points	int
}

type Health struct {
    Points      int
    Setter      EntityID
}

//May become a bit field (so we can put slowed, onfire, etc in here)
const (
    Status_Alive = iota
    Status_Dead = iota
)

type Status struct {
    StatusFlag      int
    StatusSetter    EntityID
}

//Pos, speed, look, (size eventually)
type Metrics struct {
	Pos				coords.World
	Look			coords.Direction
	Vy				float64
	Timestamp		float64
}

// Should be an int someday...
type EntityID string
