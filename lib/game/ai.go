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
	currentTime := float64(time.Now().UnixNano() / 1e6)
		
    a.ClientTick(ControlState{Forward: true, Lon: 0, Lat: 0, Timestamp: currentTime})
}