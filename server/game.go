package main

import (
	"log"
	"time"

	"buildblast/lib/game"
	"buildblast/lib/proto"
)

const (
	FramePeriod = time.Second / 60
)

type clientResponse struct {
	client *Client
	isNew  bool
}

type disconnectingClient struct {
	id     string
	reason string
}

type Game struct {
	clients map[string]*Client

	clientRequests       chan string
	clientResponses      chan clientResponse
	disconnectingClients chan disconnectingClient

	scores map[string]int

	world *game.World
}

func NewGame(world *game.World) *Game {
	g := new(Game)

	g.clients = make(map[string]*Client, 0)

	g.clientRequests = make(chan string)
	g.clientResponses = make(chan clientResponse)
	g.disconnectingClients = make(chan disconnectingClient)

	g.scores = make(map[string]int, 0)

	g.world = world
	g.world.AddBioticListener(g)

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
			isNew:  isNew,
		}
	default:
		return
	}
}

// Thread safe
func (g *Game) Disconnect(id, reason string) {
	g.disconnectingClients <- disconnectingClient{
		id:     id,
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
	g.Broadcast(&proto.MsgChatBroadcast{
		DisplayName: user,
		Message:     message,
	})
}

func (g *Game) Broadcast(m proto.Message) {
	for _, c := range g.clients {
		c.Send(m)
	}
}

func (g *Game) BroadcastLossy(m proto.Message) {
	for _, c := range g.clients {
		c.SendLossy(m)
	}
}

func (g *Game) Run() {
	updateTicker := time.Tick(FramePeriod)
	for {
		<-updateTicker
		g.Tick(int64(FramePeriod / time.Millisecond))
	}
}

func (g *Game) Tick(dt int64) {
	g.handleClientRequests()

	g.world.Tick(dt)
	for _, c := range g.clients {
		c.Tick(g, g.world)
	}
}

func (g *Game) BioticCreated(id game.EntityId, biotic game.Biotic) {
	g.Broadcast(&proto.MsgScoreboardAdd{
		Name:  string(id),
		Score: g.scores[string(id)],
	})
}

func (g *Game) BioticUpdated(id game.EntityId, biotic game.Biotic) {}
func (g *Game) BioticDamaged(id game.EntityId, biotic game.Biotic) {}

func (g *Game) BioticDied(id game.EntityId, biotic game.Biotic, killer string) {
	g.Announce(killer + " killed " + string(id))
	g.BioticDamaged(id, biotic)
	g.scores[killer]++
	g.scores[string(id)]--
	g.Broadcast(&proto.MsgScoreboardSet{
		Name:  string(id),
		Score: g.scores[string(id)],
	})
	g.Broadcast(&proto.MsgScoreboardSet{
		Name:  killer,
		Score: g.scores[killer],
	})
}

func (g *Game) BioticRemoved(id game.EntityId) {
	g.Broadcast(&proto.MsgScoreboardRemove{
		Name: string(id),
	})
}
