package game

import ()

type Player struct {
	*PlayerBase
}

func NewPlayer(world *World, name string) *Player {
	p := new(Player)
	p.PlayerBase = NewPlayerBase(world, name, p.Tick)
	return p
}

func (p *Player) Tick(w *World) {

}
