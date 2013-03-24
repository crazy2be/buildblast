package main

import (
	"log"
	"time"
)

type Client struct {
	world *World
	conn *Conn

	name string

	Broadcast chan *Message
	cm *ChunkManager
}

func NewClient(world *World, name string) *Client {
	c := new(Client)
	c.world = world
	c.name = name

	c.Broadcast = make(chan *Message, 10)
	c.cm = newChunkManager()

	return c
}

func (c *Client) Run(conn *Conn) {
	c.conn = conn
	c.world.Join <- c

	for {
		select {
			case m := <-c.Broadcast:
				// A bit of a gross hack, but we don't want the player
				// to recieve broadcast messages for the position of
				// their own entity.
				if m.Kind == MSG_ENTITY_POSITION && c.name == m.Payload["id"] {
					continue
				}
				c.conn.Send(m)
			default:
				m := c.conn.Recv()
				if m != nil {
					c.handleMessage(m)
				} else {
					c.world.Leave <- c
					return
				}
		}
	}
}

func (c *Client) RunChunks(conn *Conn) {
	for {
		cc, valid := c.cm.top()
		if !valid {
			<-time.After(time.Second / 10)
			continue
		}

		m := NewMessage(MSG_CHUNK)
		m.Payload["ccpos"] = cc.toMap()
		m.Payload["size"] = map[string]interface{}{
			"w": CHUNK_WIDTH,
			"h": CHUNK_HEIGHT,
			"d": CHUNK_DEPTH,
		}

		chunk := c.world.RequestChunk(cc)
		m.Payload["data"] = chunk.Flatten()

		conn.Send(m)
	}
}

func (c *Client) handleMessage(m *Message) {
	switch m.Kind {
		case "block":
			c.handleBlock(m)
		case "player-position":
			c.handleClientPosition(m)
		default:
			log.Print("Unknown message recieved from client of kind ", m.Kind)
			return
	}
}

func (c *Client) sendClientPos(wc WorldCoords) {
	m := NewMessage(MSG_PLAYER_POSITION)
	m.Payload["pos"] = wc.toMap()
	c.conn.Send(m)
}

func (c *Client) handleBlock(m *Message) {
	pl := m.Payload
	wc := readWorldCoords(pl)
	typ := Block(pl["type"].(float64))

	c.world.ChangeBlock(wc, typ)
	c.world.Broadcast <- m
}

func (c *Client) handleClientPosition(m *Message) {
	pl := m.Payload
	// TODO: Verify position is valid
	// (they didn't move too much in the last
	// couple frames, and they are not currently
	// in the ground).
	wc := readWorldCoords(pl["pos"].(map[string]interface{}))

	pl["id"] = c.name
	m.Kind = MSG_ENTITY_POSITION
	c.world.Broadcast <- m

	occ := func (cc ChunkCoords, x, y, z int) ChunkCoords {
		return ChunkCoords{
			x: cc.x + x,
			y: cc.y + y,
			z: cc.z + z,
		}
	}

	eachWithin := func (cc ChunkCoords, xdist, ydist, zdist int, cb func (newCC ChunkCoords, dist int)) {
		abs := func (n int) int {
			if n < 0 {
				return -n
			}
			return n
		}
		dist := func (x, y, z int) int {
			return abs(x) + abs(y) + abs(z)
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
		c.cm.display(newCC, -dist)
	});

	oc := wc.Offset();
	if oc.y <= 4 {
		c.cm.display(occ(cc, 0, -1, 0), 1);
	} else if oc.y >= 28 {
		c.cm.display(occ(cc, 0, 1, 0), 1);
	}
}
