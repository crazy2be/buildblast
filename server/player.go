package main

import (
	"log"
	"math/rand"
	"code.google.com/p/go.net/websocket"
)
// http://stackoverflow.com/questions/12771930/what-is-the-fastest-way-to-generate-a-long-random-string-in-go
func randString(n int) string {
	const alphanum = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	bytes := make([]byte, n)
	for i := 0; i < n; i++ {
		bytes[i] = alphanum[rand.Int() % len(alphanum)]
	}
	return string(bytes)
}

type Player struct {
	w *World
	c *Conn

	name string

	Broadcast chan *Message
	cm *ChunkManager
}

func NewPlayer(world *World) *Player {
	p := new(Player)
	p.w = world

	p.name = "player-" + randString(10)

	p.Broadcast = make(chan *Message, 10)
	p.cm = newChunkManager()

	return p
}

func (p *Player) Run(ws *websocket.Conn) {
	p.c = NewConn(ws)
	p.w.Join <- p

	m := NewMessage("player-id")
	m.Payload["id"] = p.name
	p.c.Send(m)

	for {
		select {
		case m := <-p.Broadcast:
			// A bit of a gross hack, but we don't want the player
			// to recieve broadcast messages for the position of
			// their own entity.
			if m.Kind == "entity-position" && p.name == m.Payload["id"] {
				continue
			}
			p.c.Send(m)
		default:
			m := p.c.Recv()
			if m != nil {
				p.handleMessage(m)
			} else {
				p.w.Leave <- p
				return
			}
		}
	}
}

func (p *Player) handleMessage(m *Message) {
	switch m.Kind {
	case "block":
		p.handleBlock(m)
	case "player-position":
		p.handlePlayerPosition(m)
	default:
		log.Print("Unknown message recieved from client of kind ", m.Kind)
		return
	}
}

func (p *Player) sendPlayerPos(wc WorldCoords) {
	m := NewMessage("player-position")
	m.Payload["pos"] = wc.toMap()
	p.c.Send(m)
}

func (p *Player) handleBlock(m *Message) {
	pl := m.Payload
	wc := readWorldCoords(pl)
	typ := Block(pl["type"].(float64))

	p.w.ChangeBlock(wc, typ)
	p.w.Broadcast <- m
}

func (p *Player) handlePlayerPosition(m *Message) {
	pl := m.Payload
	// TODO: Verify position is valid
	// (they didn't move too much in the last
	// couple frames, and they are not currently
	// in the ground).
	wc := readWorldCoords(pl["pos"].(map[string]interface{}))

	pl["id"] = p.name
	m.Kind = "entity-position"
	p.w.Broadcast <- m

	occ := func (cc ChunkCoords, x, y, z int) ChunkCoords {
		return ChunkCoords{
			x: cc.x + x,
			y: cc.y + y,
			z: cc.z + z,
		}
	}

	eachWithin := func (cc ChunkCoords, xdist, ydist, zdist int, cb func (newCC ChunkCoords, dist int)) {
		dist := func (x, y, z int) int {
			val := 0
			if x > 0 {
				val += x
			} else {
				val -= x
			}
			if y > 0 {
				val += y
			} else {
				val -= y
			}
			if z > 0 {
				val += z
			} else {
				val -= z
			}
			return val
		}
		cb(cc, 0)
		for x := -xdist; x <= xdist; x++ {
			for y := -ydist; y <= ydist; y++ {
				for z := -zdist; z <= zdist; z++ {
					cb(occ(cc, x, y, z), dist(x, y, z))
				}
			}
		}
	}
	cc := wc.Chunk()
	eachWithin(cc, 2, 0, 2, func (newCC ChunkCoords, dist int) {
		p.cm.display(newCC, -dist)
	});
	oc := wc.Offset();
	if oc.y <= 4 {
		p.cm.display(occ(cc, 0, -1, 0), 1);
	} else if oc.y >= 28 {
		p.cm.display(occ(cc, 0, 1, 0), 1);
	}
}
