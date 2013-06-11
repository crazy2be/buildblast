package main

import (
	"log"
	"time"
)

type Game struct {
	clients []*Client
	world *World
}

func NewGame() *Game {
	g := new(Game)
	g.clients = make([]*Client, 0)
	g.world = NewWorld(0)
	return g
}

func (g *Game) Connect(c *Client) {
	g.clients = append(g.clients, c)
}

func (g *Game) Disconnect(c *Client) {
	i := g.findClient(c)
	if i == -1 {
		log.Println("[WARN] Attempt to disconnect client who is not connected.")
	}
	g.clients[i] = g.clients[len(g.clients) - 1]
	g.clients = g.clients[:len(g.clients) - 1]
}

func (g *Game) Announce(message string) {
	log.Println("[ANNOUNCE]", message)
	g.Broadcast(&MsgChat{
		DisplayName: "SERVER",
		Message: message,
	})
}

func (g *Game) Broadcast(m Message) {
	for _, c := range g.clients {
		c.Send(m)
	}
}

func (g *Game) BroadcastLossy(m Message) {
	for _, c := range g.clients {
		c.SendLossy(m)
	}
}

func (g *Game) findClient(c *Client) int {
	for i, other := range g.clients {
		if other == c {
			 return i
		}
	}
	return -1
}

func (g *Game) Run() {
	updateTicker := time.Tick(time.Second / 60)
	for {
		<-updateTicker
		g.Tick()
	}
}

func (g *Game) Tick() {
// 	for _, c := range g.clients {
// 		c.Tick(g)
// 	}
	g.world.Tick(g)
}
