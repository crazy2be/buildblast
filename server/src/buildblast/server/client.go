package main

import (
	"log"
	"fmt"
	"time"
	"reflect"

	"buildblast/game"
	"buildblast/coords"
	"buildblast/mapgen"
)

type Client struct {
	*ClientConn

	name string

	// Send the client the right chunks.
	cm *ChunkManager

	chunkSendQueue chan *MsgChunk
	blockSendQueue chan *MsgBlock

	player *game.Player
}

func NewClient(name string) *Client {
	c := new(Client)
	c.ClientConn = NewClientConn(name)

	c.name = name

	c.cm = NewChunkManager()

	c.chunkSendQueue = make(chan *MsgChunk, 10)
	c.blockSendQueue = make(chan *MsgBlock, 10)

	return c
}

func (c *Client) Tick(g *Game, w *game.World) {
	for {
		select {
		case m := <-c.recvQueue:
			c.handleMessage(g, w, m)
		default:
			return
		}
	}
}

func (c *Client) handleMessage(g *Game, w *game.World, m Message) {
	switch m.(type) {
		case *MsgBlock:
			m := m.(*MsgBlock)
			w.ChangeBlock(m.Pos, m.Type)

		case *MsgControlsState:
			m := m.(*MsgControlsState)
			m.Controls.Timestamp = m.Timestamp
			c.handleControlState(g, w, m)

		case *MsgChat:
			g.Chat(c.name, m.(*MsgChat).Message)

		case *MsgInventoryState:
			m := m.(*MsgInventoryState)
			c.player.SetActiveItems(m.ItemLeft, m.ItemRight)

		default:
			log.Print("Unknown message recieved from client:", reflect.TypeOf(m))
			return
	}
}

func (c *Client) handleControlState(g *Game, w *game.World, m *MsgControlsState) {
	pos, vy, hp, inventory, hitPos := c.player.ClientTick(m.Controls)

	c.cm.QueueChunksNearby(pos)

	c.Send(&MsgPlayerState{
		Pos: pos,
		VelocityY: vy,
		Timestamp: m.Timestamp,
		Hp: hp,
	})

	c.Send(&MsgInventoryState{
		Items: game.ItemsToString(inventory),
	})

	if hitPos != nil {
		g.Broadcast(&MsgDebugRay{
			Pos: *hitPos,
		})
}
}

func (c *Client) Connected(g *Game, w *game.World) {
	p := game.NewPlayer(w, c.name)

	for _, id := range w.GetEntityIDs() {
		c.Send(&MsgEntityCreate{
			ID: id,
		})
	}

	w.AddEntity(p)
	w.AddBlockListener(c)
	c.player = p
}

func (c *Client) Disconnected(g *Game, w *game.World) {
	w.RemoveEntity(c.player)
	w.RemoveBlockListener(c)
}

func (c *Client) BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block) {
	m := &MsgBlock{
		Pos: bc,
		Type: new,
	}
	select {
	case c.blockSendQueue <- m:
	default:
		c.Errors <- fmt.Errorf("WARN: Unable to send block update to player %s", c.name)
	}
}

// WARNING: This runs on a seperate thread from everything
// else in client! It should be refactored, but for now, just be cautious.
func (c *Client) RunChunks(conn *Conn, world *game.World) {
	for {
		select {
		case m := <-c.blockSendQueue:
			conn.Send(m)
		default:
		}
		// c.cm.Top() doesn't block, so we are effectively polling
		// it every tenth of a second. Sketchy, I know.
		cc, valid := c.cm.Top()
		if !valid {
			<-time.After(time.Second / 10)
			continue
		}

		// This has lots of thread safety problems, we
		// should probably fix it.
		chunk := world.RequestChunk(cc)

		m := &MsgChunk{
			CCPos: cc,
			Size: coords.ChunkSize,
			Data: chunk.Flatten(),
		}

		conn.Send(m)
	}
}
