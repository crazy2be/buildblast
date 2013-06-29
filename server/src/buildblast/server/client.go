package main

import (
	"log"
	"time"
	"reflect"

	"buildblast/coords"
)



type Client struct {
	*ClientConn

	name string

	// Send the client the right chunks.
	cm *ChunkManager
}

func NewClient(name string) *Client {
	c := new(Client)
	c.ClientConn = NewClientConn(name)

	c.name = name

	c.cm = NewChunkManager()

	return c
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

func (c *Client) Send(m Message) {
	// A bit of a hack...
	if mep, ok := m.(*MsgPlayerState); ok {
		c.cm.QueueChunksNearby(mep.Pos)
	}
	c.ClientConn.Send(m)
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
