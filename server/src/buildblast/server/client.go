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

	player *Player
}

func NewClient(name string) *Client {
	c := new(Client)
	c.ClientConn = NewClientConn(name)

	c.name = name

	c.cm = NewChunkManager()

	return c
}

func (c *Client) Tick(g *Game, w *World) {
	for {
		select {
		case m := <-c.recvQueue:
			c.handleMessage(g, c.player, m)
		case m := <-c.player.outgoing:
			c.cm.QueueChunksNearby(m.Pos)
			c.Send(m)
		case m := <-c.player.outInv:
			c.Send(m)
		default:
			return
		}
	}
}

func (c *Client) Connected(g *Game, w *World) {
	p := NewPlayer(w, c.name)

	for _, id := range w.GetEntityIDs() {
		c.Send(&MsgEntityCreate{
			ID: id,
		})
	}

	w.AddEntity(p)
	c.player = p
}

func (c *Client) Disconnected(g *Game, w *World) {
	w.RemoveEntity(c.player)
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

// WARNING: This runs on a seperate thread from everything
// else in client! It should be refactored, but for now, just be cautious.
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
