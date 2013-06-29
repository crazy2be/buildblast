package main

import (
	"log"
	"time"
)

type Game struct {
	clients []*Client
	connectingClients chan *Client
	disconnectingClients   chan *Client
	world          *World
}

func NewGame() *Game {
	g := new(Game)

	g.clients = make([]*Client, 0)
	g.connectingClients = make(chan *Client, 10)
	g.disconnectingClients = make(chan *Client, 10)

	g.world = NewWorld(float64(time.Now().Unix()))
	return g
}

// Thread safe
func (g *Game) Connect(c *Client) {
	g.connectingClients <- c
}

// Not thread safe (This better be called on the Games main thread)
func (g *Game) handleConnectingClients() {
	for {
		select {
		case c := <-g.connectingClients:
			g.clients = append(g.clients, c)
			c.Connected(g, g.world)
			g.Announce(c.name + " has joined the game!")
		default:
			return
		}
	}
}

func (g *Game) Disconnect(c *Client) {
	g.disconnectingClients <- c
}

func (g *Game) handleDisconnectingClients() {
	for {
		select {
		case c := <-g.disconnectingClients:
			i := g.findClient(c)
			if i == -1 {
				log.Println("[WARN] Attempt to disconnect user who is not connected.")
				return
			}
			g.clients[i] = g.clients[len(g.clients) - 1]
			g.clients = g.clients[:len(g.clients) - 1]

			c.Disconnected(g, g.world)

			g.Announce(c.name + " has left the game :(")
		default:
			return
		}
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

func (g *Game) handleEntityChanges() {
	for {
		select {
		case id := <-g.world.EntityCreate:
			g.Broadcast(&MsgEntityCreate{
				ID: id,
			})
		case id := <-g.world.EntityRemove:
			g.Broadcast(&MsgEntityRemove{
				ID: id,
			})
		default:
			return
		}
	}
}

func (g *Game) handleChatEvents() {
	for {
		select {
		case text := <-g.world.ChatEvents:
			g.Announce(text)
		default:
			return
		}
	}
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

func (g *Game) Run() {
	updateTicker := time.Tick(time.Second / 60)
	for {
		<-updateTicker
		g.Tick()
	}
}

func (g *Game) Tick() {
	g.handleConnectingClients()
	g.handleDisconnectingClients()
	g.handleEntityChanges()
	g.handleChatEvents()
	g.world.Tick(g)
	for _, c := range g.clients {
		c.Tick(g, g.world)
		select {
		case <-c.Errors:
			g.Disconnect(c)
		default:
		}
	}
}
