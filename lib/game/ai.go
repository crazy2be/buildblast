package game

import (
	"time"
)

type Ai struct {
	*PlayerBase
	
	moveDelay		float64
	lastTime		float64
	
	controlState	ControlState
}

func NewAi(world *World, name string) *Ai {
	a := new(Ai)
	a.PlayerBase = NewPlayerBase(world, name, a.Tick)
	a.moveDelay = 0
	
	a.controlState = ControlState{Forward: true, Lon: 0, Lat: 0}
	
	return a
}

func (a *Ai) Tick(w *World) {
	currentTime := float64(time.Now().UnixNano() / 1e6)
	dt := currentTime - a.lastTime
	a.lastTime = currentTime
	
	a.moveDelay -= dt
	
	a.controlState.Timestamp = currentTime
	a.ClientTick(a.controlState)
	
	if(a.moveDelay < 0) {
		a.moveDelay = 5000
	}
}