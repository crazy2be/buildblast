package game

import (
	"math/rand"
	"time"
)

type Ai struct {
	*PlayerBase

	moveDelay float64
	lastTime  float64

	controlState ControlState
}

func NewAi(world *World, name string) *Ai {
	a := new(Ai)
	a.PlayerBase = NewPlayerBase(world, name, a.Tick)
	a.moveDelay = 0

	a.controlState = ControlState{Forward: true, Lon: -1.7, Lat: 3.3}

	return a
}

func (a *Ai) Tick(w *World) {
	currentTime := float64(time.Now().UnixNano() / 1e6)
	dt := currentTime - a.lastTime
	a.lastTime = currentTime

	a.moveDelay -= dt

	a.controlState.Timestamp = currentTime
	_, collided := a.ClientTick(a.controlState)

	a.controlState.ActivateLeft = false

	if a.moveDelay < 0 || collided {
		a.moveDelay = 5000

		a.controlState.Forward = false
		a.controlState.Left = false
		a.controlState.Right = false
		a.controlState.Back = false
		a.controlState.Jump = false
		a.controlState.ActivateLeft = false

		randNum := rand.Float64()
		switch {
		case randNum < 0.1:
			a.controlState.Forward = true
			break
		case randNum < 0.2:
			a.controlState.Forward = true
			a.controlState.Left = true
			break
		case randNum < 0.3:
			a.controlState.Left = true
			break
		case randNum < 0.4:
			a.controlState.Left = true
			a.controlState.Back = true
			break
		case randNum < 0.5:
			a.controlState.Back = true
			break
		case randNum < 0.6:
			a.controlState.Back = true
			a.controlState.Right = true
			break
		case randNum < 0.7:
			a.controlState.Right = true
			break
		case randNum < 0.8:
			a.controlState.Right = true
			a.controlState.Forward = true
			break
		case randNum < 0.9:
			a.controlState.Jump = true
			break
		case randNum < 1.0:
			a.controlState.ActivateLeft = true
			break
		}
	}
}
