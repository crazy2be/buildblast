package main

import (
	"log"
	"time"
)

type User struct {
	client *Client
	player *Player
}

type Game struct {
	users          []*User
	pendingClients chan *Client
	leavingUsers   chan *User
	world          *World
}

func NewGame(w *World) *Game {
	g := new(Game)
	g.users = make([]*User, 0)
	g.pendingClients = make(chan *Client, 10)
	g.leavingUsers = make(chan *User, 10)
// 	g.world = NewWorld(0)
	g.world = w
	return g
}

// Thread safe
func (g *Game) Connect(c *Client) {
	g.pendingClients <- c
}

// Not thread safe (This better be called on the Games main thread)
func (g *Game) handlePendingClients() {
	for {
		select {
		case c := <-g.pendingClients:
			p := NewPlayer(g.world, c.name)
			user := new(User)
			user.client = c
			user.player = p
			g.users = append(g.users, user)
			g.world.AddEntity(p)
			g.Announce(c.name + " has joined the game!")
		default:
			return
		}
	}
}

func (g *Game) Disconnect(u *User) {
	g.leavingUsers <- u
}

func (g *Game) handleLeavingUsers() {
	for {
		select {
		case u := <-g.leavingUsers:
			i := g.findUser(u)
			if i == -1 {
				log.Println("[WARN] Attempt to disconnect user who is not connected.")
				return
			}
			g.users[i] = g.users[len(g.users) - 1]
			g.users = g.users[:len(g.users) - 1]

			g.Announce(u.client.name + " has left the game :(")
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
	for _, u := range g.users {
		u.client.Send(m)
	}
}

func (g *Game) BroadcastLossy(m Message) {
	for _, u := range g.users {
		u.client.SendLossy(m)
	}
}

func (g *Game) findUserByName(name string) *User {
	for _, u := range g.users {
		if u.client.name == name {
			return u
		}
	}
	return nil
}

func (g *Game) findUser(u *User) int {
	for i, other := range g.users {
		if other == u {
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
	g.handleLeavingUsers()
	g.handlePendingClients()
	for _, u := range g.users {
		u.client.Tick(g, u.player)
		select {
		case <-u.client.Errors:
			g.Disconnect(u)
		default:
		}
	}
	g.world.Tick(g)
}
