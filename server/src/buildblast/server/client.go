package main

import (
	"log"
	"fmt"
	"time"
	"reflect"

	"buildblast/coords"
)

type Client struct {
	Errors chan error

	world *World

	name string

	// Generic messages to be sent to client
	sendQueue chan Message
	sendLossyQueue chan Message

	// Generic messages recieved from client
	recvQueue chan Message

	// Send the client the right chunks.
	cm *ChunkManager
}

func NewClient(world *World, name string) *Client {
	c := new(Client)
	c.Errors = make(chan error, 10)

	c.world = world
	c.name = name

	c.sendQueue = make(chan Message, 200)
	c.sendLossyQueue = make(chan Message, 5)

	c.recvQueue = make(chan Message, 100)

	c.cm = NewChunkManager()

	return c
}

func (c *Client) Run(conn *Conn) {
	go c.RunSend(conn)
	c.RunRecv(conn)
}

func (c *Client) RunSend(conn *Conn) {
	for {
		var m Message
		select {
		case m = <-c.sendQueue:
		case m = <-c.sendLossyQueue:
		}

		err := conn.Send(m)
		if err != nil {
			c.Errors <- err
		}
	}
}

func (c *Client) RunRecv(conn *Conn) {
	for {
		m, err := conn.Recv()
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

// Send will queue a message to be sent to a client. If there is
// an error transmitting the message, an error will be sent back
// on the Errors channel.
func (c *Client) Send(m Message) {
	select {
	case c.sendQueue <- m:
		if mep, ok := m.(*MsgPlayerState); ok {
			c.cm.QueueChunksNearby(mep.Pos)
		}
	default:
		c.Errors <- fmt.Errorf("unable to send message %v to player %s", m, c.name)
	}
}

// SendLossy will try to queue a message to be sent to a client,
// but if it cannot, it will simply do nothing. The message's failure
// to send will not result in an error.
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
		cc, valid := c.cm.Top()
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
