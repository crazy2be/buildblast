package main

import (
	"log"
	"time"
	"math"
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
	vy        float64
	controls  ControlState
}

func (p *Player) simulateStep(c *Client, dt time.Duration) {
	controls := <-c.ControlState
	sec := dt.Seconds()

	p.vy += sec * -9.81

	fw := 0.0
	if controls.Forward {
		fw = 1 * sec * 10
	} else if controls.Back {
		fw = -1 * sec * 10
	}

	rt := 0.0
	if controls.Right {
		rt = 1 * sec * 10
	} else if controls.Left {
		rt = -1 * sec * 10
	}

	cos := math.Cos
	sin := math.Sin
	dx := -cos(controls.Lon) * fw + sin(controls.Lon) * rt
	dy := p.vy * sec
	dz := -sin(controls.Lon) * fw - cos(controls.Lon) * rt
	log.Println("Moving client", c.name, "by", dx, dy, dz)
	p.pos.X += dx
// 	p.pos.Y += dy
	p.pos.Z += dz
}
