package main

import (
	"log"
	"time"
	"reflect"

	"buildblast/coords"
)

type Client struct {
	Errors chan error

	world *World
	conn *Conn

	name string

	// Generic messages to be sent to client
	sendQueue chan Message
	sendLossyQueue chan Message

	// Generic messages recieved from client
	recvQueue chan Message

	// Send the client the right chunks.
	cm *ChunkManager

	// Be careful! Player is owned by the world,
	// and runs in a different thread.
	player *Player
}

func NewClient(world *World, conn *Conn, name string) *Client {
	c := new(Client)
	c.Errors = make(chan error, 10)

	c.world = world
	c.conn = conn
	c.name = name

	c.sendQueue = make(chan Message, 20)
	c.sendLossyQueue = make(chan Message, 5)

	c.recvQueue = make(chan Message, 10)

	c.cm = NewChunkManager()

	c.player = NewPlayer(world, name)
	world.AddEntity(c.player)

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
			mntp.ServerTime = float64(time.Now().UnixNano()) / 1e6
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
			c.cm.QueueChunksNearby(mep.Pos)
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
		cc, valid := c.cm.Top()
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

func (c *Client) handleMessage(g *Game, m Message) {
	switch m.(type) {
		case *MsgBlock:
			m := m.(*MsgBlock)
			c.world.ChangeBlock(m.Pos, m.Type)
			g.Broadcast(m)
		case *MsgControlsState:
			m := m.(*MsgControlsState)
			m.Controls.Timestamp = m.Timestamp
			c.player.incoming <- &m.Controls
		case *MsgChat:
			g.Chat(c.name, m.(*MsgChat).Message)
		default:
			log.Print("Unknown message recieved from client:", reflect.TypeOf(m))
			return
	}
}
