package main

import (
	"log"
	"time"
)

type ControlState struct {
	Forward bool
	Left bool
	Right bool
	Back bool
	Lat float64
	Lon float64
	Timestamp float64
}

type Player struct {
	pos       WorldCoords
	rot       Vec3
	controls  ControlState
}

func (p *Player) simulateStep(c *Client, dt time.Duration) {
	controls := <-c.ControlState
	dist := float64(dt) / 100000000000000000000
	if controls.Forward {
		log.Println("Moving by ", dist)
		p.pos.X += dist
	} else if controls.Back {
		log.Println("Moving by ", dist)
		p.pos.X -= dist
	}
	if controls.Left {
		log.Println("Moving by ", dist)
		p.pos.Z += dist
	} else if controls.Right {
		log.Println("Moving by ", dist)
		p.pos.Z -= dist
	}
}
