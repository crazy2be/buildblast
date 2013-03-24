package main

import (

)

type ControlState struct {
	Forward bool
	Left bool
	Right bool
	Back bool
	Lat float64
	Lon float64
}

type PlayerState struct {
	Position WorldCoords
	Rotation Vec3
	Controls ControlState
	Name     string
}


type Player PlayerState
func NewPlayer(name string, pos WorldCoords) *Player {
	p := new(Player)
	p.Name = name
	p.Position = pos
	return p
}
