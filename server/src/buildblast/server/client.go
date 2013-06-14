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

	// Generic messages to be sent to client
	sendQueue chan Message
	sendLossyQueue chan Message

	// Generic messages recieved from client
	recvQueue chan Message

	// Server-side simulation of players.
	ControlState chan *ControlState

	// Send the client the right chunks.
	cm *ChunkManager

	player *Player
}

func NewClient(world *World, name string) *Client {
	c := new(Client)
	c.world = world
	c.name = name

	c.sendQueue = make(chan Message, 20)
	c.sendLossyQueue = make(chan Message, 5)

	c.recvQueue = make(chan Message, 10)

	c.ControlState = make(chan *ControlState, 10)
	c.cm = newChunkManager()

	c.player = NewPlayer(world, name)
	world.AddEntity(c.player)

	return c
}

func (c *Client) Run(conn *Conn) {
	c.conn = conn
// 	c.world.Join <- c

	go c.RunSend(conn)
	c.RunRecv(conn)
}

func (c *Client) RunSend(conn *Conn) {
	for {
		select {
		case m := <-c.sendQueue:
			c.conn.Send(m)
		case m := <-c.sendLossyQueue:
			c.conn.Send(m)
		}
	}
}

func (c *Client) RunRecv(conn *Conn) {
	for {
		m := c.conn.Recv()
		if m == nil {
			c.world.Leave <- c
			return
		}
		c.recvQueue <- m
	}
}

func (c *Client) Tick(g *Game) {
	for {
		select {
		case m := <-c.recvQueue:
			c.handleMessage(g, m)
		default:
			return
		}
		select {
		case m := <-c.player.outgoing:
			c.Send(m)
		default:
		}
	}
}

func (c *Client) Send(m Message) {
	select {
	case c.sendQueue <- m:
		if mep, ok := m.(*MsgPlayerState); ok {
			c.queueNearbyChunks(mep.Pos)
		}
	default:
		log.Println("[WARN] Unable to send message", m, "to player", c.name)
	}
}

func (c *Client) SendLossy(m Message) {
	if mep, ok := m.(*MsgEntityPosition); ok && mep.ID == c.name {
		return
	}
	select {
	case c.sendLossyQueue <- m:
	default:
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

func (c *Client) handleMessage(g *Game, m Message) {
	switch m.(type) {
		case *MsgBlock:
			c.handleBlock(m.(*MsgBlock))
		case *MsgControlsState:
			c.handleControlsState(m.(*MsgControlsState))
		case *MsgChat:
			c.handleChat(g, m.(*MsgChat))
		case *MsgNtpSync:
			c.handleNtpSync(m.(*MsgNtpSync))
		default:
			log.Print("Unknown message recieved from client:", reflect.TypeOf(m))
			return
	}
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

func (c *Client) handleControlsState(m *MsgControlsState) {
	m.Controls.Timestamp = m.Timestamp
	c.player.incoming <- &m.Controls
}

func (c *Client) handleChat(g *Game, m *MsgChat) {
	m.DisplayName = c.name
	log.Println("[CHAT]", m.DisplayName + ":", m.Message)
	g.Broadcast(m)
}

func (c *Client) handleNtpSync(m *MsgNtpSync) {
	m.ServerTime = float64(time.Now().UnixNano()) / 1e6
	c.Send(m)
}
