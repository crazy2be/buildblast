package main

import (
	"fmt"
	"log"
	"time"

	"os"
	"runtime"
	"runtime/pprof"

	"buildblast/lib/game"
	"buildblast/lib/geom"
	"buildblast/lib/observable"
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
    observable.DisposeExposedImpl

	clients map[string]*Client

	clientRequests       chan string
	clientResponses      chan clientResponse
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

	g.world.EntitiesObserv.OnAdd(g, g.EntityCreatedCallback)
	
	g.world.MaxPoints = observable.NewObservable(g, 60 * 35)
	
	g.world.Teams.Set("Red", game.Team {
		Name: "Red",
		Color: "red",
		Points: 0,
	})
	
	g.world.Teams.Set("Blue", game.Team {
		Name: "Blue",
		Color: "blue",
		Points: 0,
	})
	
	g.world.Teams.OnAdd(g, g.TeamAddedCallback)
	
	return g
}

func (g *Game) TeamAddedCallback(key observable.Object, value observable.Object) {
	g.TeamAdded(key.(string), value.(game.Team))
}
func (g *Game) TeamAdded(key string, team game.Team) {
	if team.Points < g.world.MaxPoints.Get().(int) { return }
	
	//They won
	g.Announce(team.Name + " has won, game is restarting NOW")
	
	//Move hill
	sphere := g.world.HillSphere.Get().(geom.Sphere)
	sphere.Center = g.world.FindSpawn()
	g.world.HillSphere.Set(sphere)
	
	for _, teamObj := range g.world.Teams.GetValues() {
		team := teamObj.(game.Team)
		team.Points = 0
		g.world.Teams.Set(team.Name, team)
	}
	
    for _, entityID := range g.world.EntitiesObserv.GetKeys() {
        entity := g.world.EntitiesObserv.Get(entityID)
        entity.(game.Entity).Respawn(g.world.FindSpawn())
    }
}

func (g *Game) EntityCreatedCallback(key observable.Object, value observable.Object) {
	g.EntityCreated(key.(game.EntityID), value.(game.Entity))
}
func (g *Game) EntityCreated(id game.EntityID, entity game.Entity) {
	entity.HillPoints().OnChanged(g, func(new observable.Object, prev observable.Object) {
        if entity.HillPoints().Get().(int) > 60 * 45 {
            g.Announce(string(id) + " has won, game is restarting NOW.")

            for _, entity := range g.world.EntitiesObserv.GetValues() {
				entity.(game.Entity).HillPoints().Set(0)
            }

            for _, entityID := range g.world.EntitiesObserv.GetKeys() {
                entity := g.world.EntitiesObserv.Get(entityID)
                entity.(game.Entity).Respawn(g.world.FindSpawn())
            }
        }
	})

    entity.Status().OnChanged(g, func(new observable.Object, prev observable.Object) {
        if entity.Status().Get().(game.Status).StatusFlag == game.Status_Dead {
            g.Announce(string(entity.Status().Get().(game.Status).StatusSetter) + " killed " + string(entity.ID()))            
        }
    })
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
	switch message {
	case "memProfile":
		n, _ := runtime.MemProfile(nil, true)
		fmt.Println("Writing heap profile", n)
		f, err := os.Create("leak.mprof")
		if err != nil {
			log.Fatal(err)
		}
		pprof.WriteHeapProfile(f)
		f.Close()
	case "printLeaks":
		observable.PrintLeaks()
	}

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
	}
}
