package main

import (
	"log"
	"time"
)

type Game struct {
	clients        []*Client
	pendingClients chan *Client
	world          *World
}

func NewGame(w *World) *Game {
	g := new(Game)
	g.clients = make([]*Client, 0)
	g.pendingClients = make(chan *Client, 10)
// 	g.world = NewWorld(0)
	g.world = w
	return g
}

func (g *Game) Connect(c *Client) {
	g.pendingClients <- c
}

func (g *Game) Disconnect(c *Client) {
	i := g.findClient(c)
	if i == -1 {
		log.Println("[WARN] Attempt to disconnect client who is not connected.")
		return
	}
	g.clients[i] = g.clients[len(g.clients) - 1]
	g.clients = g.clients[:len(g.clients) - 1]
	g.Announce(c.name + " has left the game :(")
}

func (g *Game) Announce(message string) {
	g.Chat("SERVER", message)
}

func (g *Game) Chat(user string, message string) {
	log.Println("[CHAT]", user + ":", message)
	g.Broadcast(&MsgChat{
		DisplayName: user,
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

func (g *Game) findClientByName(name string) *Client {
	for _, c := range g.clients {
		if c.name == name {
			return c
		}
	}
	return nil
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
	for {
		select {
		case c := <-g.pendingClients:
			g.clients = append(g.clients, c)
			g.Announce(c.name + " has joined the game!")
		default:
			break;
		}
	}
	for _, c := range g.clients {
		c.Tick(g)
		select {
		case <-c.Errors:
			g.Disconnect(c)
		default:
		}
	}
	g.world.Tick(g)
}
