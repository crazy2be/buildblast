package main

import (
	"log"
	"time"
	"reflect"

	"buildblast/coords"
)

type Client struct {
	Errors chan error

	conn *Conn

	name string

	// Generic messages to be sent to client
	sendQueue chan Message
	sendLossyQueue chan Message

	// Generic messages recieved from client
	recvQueue chan Message

	// Send the client the right chunks.
	cm *ChunkManager
}

func NewClient(conn *Conn, name string) *Client {
	c := new(Client)
	c.Errors = make(chan error, 10)

	c.conn = conn
	c.name = name

	c.sendQueue = make(chan Message, 200)
	c.sendLossyQueue = make(chan Message, 5)

	c.recvQueue = make(chan Message, 100)

	c.cm = newChunkManager()

	return c
}

func (c *Client) Run() {
	go c.RunSend()
	c.RunRecv()
}

func (c *Client) RunSend() {
	for {
		var m Message
		select {
		case m = <-c.sendQueue:
		case m = <-c.sendLossyQueue:
		}

		err := c.conn.Send(m)
		if err != nil {
			c.Errors <- err
		}
	}
}

func (c *Client) RunRecv() {
	for {
		m, err := c.conn.Recv()
		if err != nil {
			c.Errors <- err
			return
		}
		if mntp, ok := m.(*MsgNtpSync); ok {
			mntp.ServerTime = float64(time.Now().UnixNano() / 1e6)
			c.Send(mntp)
			continue
		}
		c.recvQueue <- m
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

func (c *Client) RunChunks(conn *Conn, world *World) {
	for {
		cc, valid := c.cm.top()
		if !valid {
			<-time.After(time.Second / 10)
			continue
		}

		chunk := world.RequestChunk(cc)

		m := &MsgChunk{
			CCPos: cc,
			Size: coords.CHUNK_SIZE,
			Data: chunk.Flatten(),
		}

		conn.Send(m)
	}
}

func (c *Client) Tick(g *Game, p *Player) {
	for {
		select {
		case m := <-c.recvQueue:
			c.handleMessage(g, p, m)
		case m := <-p.outgoing:
			c.Send(m)
		case m := <-p.outInv:
			c.Send(m)
		default:
			return
		}
	}
}

func (c *Client) handleMessage(g *Game, p *Player, m Message) {
	switch m.(type) {
		case *MsgBlock:
			m := m.(*MsgBlock)
			g.world.ChangeBlock(m.Pos, m.Type)
			g.Broadcast(m)
		case *MsgControlsState:
			m := m.(*MsgControlsState)
			m.Controls.Timestamp = m.Timestamp
			p.incoming <- &m.Controls
		case *MsgChat:
			g.Chat(c.name, m.(*MsgChat).Message)
		case *MsgInventoryState:
			m := m.(*MsgInventoryState)
			p.inInv <- m
		default:
			log.Print("Unknown message recieved from client:", reflect.TypeOf(m))
			return
	}
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
