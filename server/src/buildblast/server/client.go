package main

import (
	"log"
	"time"
	"reflect"

	"buildblast/coords"
)

type Client struct {
	world *World
	conn *Conn

	name string

	// Channel of messages queued by the world to be
	// sent out to this client.
	Broadcast chan Message
	PositionUpdates chan *MsgPlayerPosition
	// Channel of player state updates, to be consumed by
	// the world when simulating.
	ControlState chan *ControlState
	cm *ChunkManager
}

func NewClient(world *World, name string) *Client {
	c := new(Client)
	c.world = world
	c.name = name

	c.Broadcast = make(chan Message, 10)
	c.PositionUpdates = make(chan *MsgPlayerPosition, 10)
	c.ControlState = make(chan *ControlState, 10)
	c.cm = newChunkManager()

	return c
}

func (c *Client) Run(conn *Conn) {
	c.conn = conn
	c.world.Join <- c

	for {
		select {
		case m := <-c.Broadcast:
			if mep, ok := m.(*MsgEntityPosition); ok && mep.ID == c.name {
				continue
			}
			c.conn.Send(m)
		case m := <- c.PositionUpdates:
			c.conn.Send(m)
			c.queueNearbyChunks(m.Pos)
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

		chunk := c.world.RequestChunk(cc)

		m := &MsgChunk{
			CCPos: cc,
			Size: coords.CHUNK_SIZE,
			Data: chunk.Flatten(),
		}

		conn.Send(m)
	}
}

func (c *Client) handleMessage(m Message) {
	switch m.(type) {
		case *MsgBlock:
			c.handleBlock(m.(*MsgBlock))
		case *MsgControlsState:
			c.handleControlsState(m.(*MsgControlsState))
		case *MsgChat:
			c.handleChat(m.(*MsgChat))
		default:
			log.Print("Unknown message recieved from client:", reflect.TypeOf(m))
			return
	}
}

func (c *Client) handleControlsState(m *MsgControlsState) {
	m.Controls.Timestamp = m.Timestamp
	c.ControlState <- &m.Controls
}

func (c *Client) handleBlock(m *MsgBlock) {
	c.world.ChangeBlock(m.Pos, m.Type)
	c.world.Broadcast <- m
}

func (c *Client) queueNearbyChunks(wc coords.World) {
	occ := func (cc coords.Chunk, x, y, z int) coords.Chunk {
		return coords.Chunk{
			X: cc.X + x,
			Y: cc.Y + y,
			Z: cc.Z + z,
		}
	}

	eachWithin := func (cc coords.Chunk, xdist, ydist, zdist int, cb func (newCC coords.Chunk, dist int)) {
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
	eachWithin(cc, 2, 0, 2, func (newCC coords.Chunk, dist int) {
		c.cm.display(newCC, -dist)
	});

	oc := wc.Offset()
	if oc.Y <= 4 {
		c.cm.display(occ(cc, 0, -1, 0), 1)
	} else if oc.Y >= 28 {
		c.cm.display(occ(cc, 0, 1, 0), 1)
	}
}

func (c *Client) handleChat(m *MsgChat) {
	m.DisplayName = c.name
	m.Time = time.Now().UnixNano() / 1000
	log.Println("[CHAT]", m.DisplayName + ":", m.Message);
	c.world.Broadcast <- m
}
