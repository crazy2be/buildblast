package game

import (
	"time"
)

type Ai struct {
	*PlayerBase
}

func NewAi(world *World, name string) *Ai {
	a := new(Ai)
	a.PlayerBase = NewPlayerBase(world, name, a.Tick)
	return a
}

func (a *Ai) Tick(w *World) {
	currentTime := float64(time.Now().Unix() * 1000)
		
    a.ClientTick(ControlState{Forward: true, Timestamp: currentTime})
}