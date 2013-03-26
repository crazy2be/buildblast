package main

import (
	"log"
	"time"
	"reflect"
)

type Client struct {
	world *World
	conn *Conn

	name string

	Broadcast chan Message
	cm *ChunkManager
}

func NewClient(world *World, name string) *Client {
	c := new(Client)
	c.world = world
	c.name = name

	c.Broadcast = make(chan Message, 10)
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
			Size: CHUNK_SIZE,
			Data: chunk.Flatten(),
		}

		conn.Send(m)
	}
}

func (c *Client) handleMessage(m Message) {
	switch m.(type) {
		case *MsgBlock:
			c.handleBlock(m.(*MsgBlock))
		case *MsgPlayerPosition:
			c.handleClientPosition(m.(*MsgPlayerPosition))
		case *MsgChat:
			c.handleChat(m.(*MsgChat))
		default:
			log.Print("Unknown message recieved from client:", reflect.TypeOf(m))
			return
	}
}

func (c *Client) sendClientPos(wc WorldCoords) {
	m := MsgPlayerPosition{
		Pos: wc,
	}
	c.conn.Send(m)
}

func (c *Client) handleBlock(m *MsgBlock) {
	log.Println(m)
	c.world.ChangeBlock(m.Pos, m.Type)
// 	c.world.Broadcast <- m
}

func (c *Client) handleClientPosition(m *MsgPlayerPosition) {
	wc := m.Pos

	positionBroadcast := &MsgEntityPosition{
		Pos: m.Pos,
		Rot: m.Rot,
		ID: c.name,
	}
	c.world.Broadcast <- positionBroadcast
// 	playerState := &PlayerState{
// 		Position: wc,
// 		Rotation: readVec3(pl["rot"].(map[string]interface{})),
// 		Controls: readControlState(pl["controls"].(map[string]interface{})),
// 		Name: c.name,
// 	}
// 	c.world.StateUpdate <- playerState

	occ := func (cc ChunkCoords, x, y, z int) ChunkCoords {
		return ChunkCoords{
			X: cc.X + x,
			Y: cc.Y + y,
			Z: cc.Z + z,
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

	oc := wc.Offset()
	if oc.Y <= 4 {
		c.cm.display(occ(cc, 0, -1, 0), 1)
	} else if oc.Y >= 28 {
		c.cm.display(occ(cc, 0, 1, 0), 1)
	}
}

func (c *Client) handleChat(m *MsgChat) {
	m.ID = c.name
	m.Time = time.Now().UnixNano() / 1000
	c.world.Broadcast <- m
	log.Println("[CHAT]", m.ID, m.Message);
}
