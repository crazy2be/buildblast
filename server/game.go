package main

import (
	"log"
	"time"

	"buildblast/lib/coords"
	"buildblast/lib/game"
)

type clientResponse struct {
	client *Client
	isNew bool
}

type disconnectingClient struct {
	id string
	reason string
}

type Game struct {
	clients           map[string]*Client

	clientRequests  chan string
	clientResponses chan clientResponse
	disconnectingClients chan disconnectingClient

	world *game.World
}

func NewGame() *Game {
	g := new(Game)

	g.clients = make(map[string]*Client, 0)

	g.clientRequests = make(chan string)
	g.clientResponses = make(chan clientResponse)
	g.disconnectingClients = make(chan disconnectingClient)

	g.world = game.NewWorld(float64(time.Now().Unix()))

	return g
}

// Thread safe, blocking
// Returns a client with the given ID. If there is no client with the given
// id, creates a new client with the given ID, and adds it to the game.
func (g *Game) clientWithID(id string) (client *Client, isNew bool) {
	g.clientRequests <- id
	resp := <-g.clientResponses
	return resp.client, resp.isNew
}

func (g *Game) handleClientRequests() {
	select {
	case id := <-g.clientRequests:
		client := g.clients[id]
		isNew := false
		if client == nil {
			client = NewClient(id)
			g.clients[id] = client
			client.Connected(g, g.world)
			g.Announce(id + " has joined the game!")
			isNew = true
		}
		g.clientResponses <- clientResponse{
			client: client,
			isNew: isNew,
		}
	default:
		return
	}
}

// Thread safe
func (g *Game) Disconnect(id, reason string) {
	g.disconnectingClients <- disconnectingClient{
		id: id,
		reason: reason,
	}
}

func (g *Game) handleDisconnectingClients() {
	select {
	case disconnecting := <-g.disconnectingClients:
		g.disconnect(disconnecting.id, disconnecting.reason)
	}
}

// Not thread safe
func (g *Game) disconnect(id, reason string) {
	client := g.clients[id]
	if client == nil {
		log.Println("[WARN] Attempt to disconnect client who is not connected.")
		return
	}
	delete(g.clients, id)

	client.Disconnected(g, g.world)

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


func (g *Game) Run() {
	updateTicker := time.Tick(time.Second / 60)
	for {
		<-updateTicker
		g.Tick()
	}
}

func (g *Game) Tick() {
	g.handleClientRequests()

	g.world.Tick()
	for _, c := range g.clients {
		c.Tick(g, g.world)
		select {
		case e := <-c.Errors:
			g.disconnect(c.name, e.Error())
		default:
		}
	}
}

func (g *Game) EntityDied(id string, killer string) {
	g.Announce(killer + " killed " + id)
}

func (g *Game) EntityCreated(id string) {}
func (g *Game) EntityMoved(id string, pos coords.World) {}
func (g *Game) EntityRemoved(id string) {}
