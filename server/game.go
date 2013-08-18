package main

import (
	"log"
	"time"

	"buildblast/lib/coords"
	"buildblast/lib/game"
)

type Game struct {
	clients           map[string]*Client
	connectingClients chan *Client

	clientRequests  chan string
	clientResponses chan *Client

	world *game.World
}

func NewGame() *Game {
	g := new(Game)

	g.clients = make(map[string]*Client, 0)

	g.connectingClients = make(chan *Client, 10)

	g.clientRequests = make(chan string)
	g.clientResponses = make(chan *Client)

	g.world = game.NewWorld(float64(time.Now().Unix()))
	g.world.AddEntityListener(g)

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
			id := c.name
			if g.clients[id] != nil {
				log.Println("[WARN] Attempt to connect client with id", id, "who is already playing in this world!")
				c.Send(&MsgChat{
					DisplayName: "SERVER",
					Message:     "Player with name " + id + " already playing on this world!",
				})
				return
			}

			g.clients[id] = c
			c.Connected(g, g.world)
			g.Announce(id + " has joined the game!")
		default:
			return
		}
	}
}

// Not thread safe
func (g *Game) Disconnect(c *Client, reason string) {
	id := c.name
	if g.clients[id] == nil {
		log.Println("[WARN] Attempt to disconnect user who is not connected.")
		return
	}
	delete(g.clients, id)

	c.Disconnected(g, g.world)

	g.Announce(id + " has left the game: " + reason)
}

func (g *Game) Announce(message string) {
	g.Chat("SERVER", message)
}

func (g *Game) Chat(user string, message string) {
	log.Println("[CHAT]", user+":", message)
	g.Broadcast(&MsgChat{
		DisplayName: user,
		Message:     message,
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

func (g *Game) clientWithID(id string) *Client {
	g.clientRequests <- id
	return <-g.clientResponses
}

func (g *Game) handleClientRequests() {
	for {
		select {
		case id := <-g.clientRequests:
			g.clientResponses <- g.clients[id]
		default:
			return
		}
	}
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
	g.handleClientRequests()

	g.world.Tick()
	for _, c := range g.clients {
		c.Tick(g, g.world)
		select {
		case e := <-c.Errors:
			g.Disconnect(c, e.Error())
		default:
		}
	}
}

func (g *Game) EntityCreated(id string) {}

func (g *Game) EntityMoved(id string, pos coords.World) {}

func (g *Game) EntityDied(id string, killer string) {
	g.Announce(killer + " killed " + id)
}

func (g *Game) EntityRemoved(id string) {}
