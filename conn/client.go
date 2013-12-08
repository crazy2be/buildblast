package main

import (
	"fmt"
	"reflect"
	"sync"
	"time"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
	"buildblast/lib/observ"
	"buildblast/conn"
)

type Client struct {
	observ.DisposeExposedImpl

	conn *conn.ClientConn

	name string

	// Send the client the right chunks.
	cm             *ChunkManager
	blockSendQueue chan *conn.MsgBlock
	chunksOnce     sync.Once

	player *game.Player

	//Eventually this should be moved above us
	entitySync *EntitySync
}

func NewClient(name string) *Client {
	observ.PrintLeaks()

	c := new(Client)
	c.WatchLeaks("Client")

	c.conn = conn.NewClientConn(name)

	c.name = name

	c.cm = NewChunkManager()
	c.blockSendQueue = make(chan *conn.MsgBlock, 10)

	return c
}

func (c *Client) Tick(g *Game, w *game.World) {
	for {
		select {
		case m := <-c.conn.recvQueue:
			c.handleMessage(g, w, m)
		case e := <-c.conn.errorQueue:
			g.disconnect(c.name, e.Error())
			return
		default:
			return
		}
	}
}

func (c *Client) handleMessage(g *Game, w *game.World, m conn.Message) {
	switch m.(type) {
	case *conn.MsgBlock:
		m := m.(*MsgBlock)
		c.handleBlock(g, w, m)

	case *conn.MsgControlsState:
		m := m.(*MsgControlsState)
		m.Controls.Timestamp = m.Timestamp
		m.Controls.ViewTimestamp = m.ViewTimestamp
		c.handleControlState(g, w, m)

	case *conn.MsgChat:
		g.Chat(c.name, m.(*MsgChat).Message)

	case *conn.MsgInventoryState:
		m := m.(*MsgInventoryState)
		c.player.Inventory().SetActiveItems(m.ItemLeft, m.ItemRight)

	case *conn.MsgInventoryMove:
		m := m.(*MsgInventoryMove)
		c.player.Inventory().MoveItems(m.From, m.To)

		c.Send(&MsgInventoryState{
			Items: c.player.Inventory().ItemsToString(),
		})

	default:
		c.conn.Error(fmt.Errorf("unknown message recieved from client: %s", reflect.TypeOf(m)))
	}
}

func (c *Client) handleBlock(g *Game, w *game.World, m *MsgBlock) {
	// Eventually we should simulate block placement/removal entirely
	// on the server side, but for now, this works fairly well.
	inv := c.player.Inventory()
	curBlock := w.Block(m.Pos)

	if curBlock == mapgen.BLOCK_AIR {
		// Placing a block
		item := game.ItemFromBlock(m.Type)
		if inv.RemoveItem(item) {
			w.ChangeBlock(m.Pos, m.Type)
		} else {
			c.sendBlockChanged(m.Pos, curBlock)
		}
	} else {
		// Removing a block
		item := game.ItemFromBlock(curBlock)
		inv.AddItem(item)
		w.ChangeBlock(m.Pos, mapgen.BLOCK_AIR)
	}

	c.Send(&conn.MsgInventoryState{
		Items: c.player.Inventory().ItemsToString(),
	})
}

func (c *Client) handleControlState(g *Game, w *game.World, m *conn.MsgControlsState) {
	shotPos, _ := c.player.ClientTick(m.Controls)

	c.cm.QueueChunksNearby(w, c.player.Pos())

	if shotPos != nil {
		g.Broadcast(&conn.MsgDebugRay{
			Pos: *shotPos,
		})
	}
}

func (c *Client) Connected(g *Game, w *game.World) {
	p := game.NewPlayer(w, c.name)

	c.entitySync = NewEntitySync(w, c.conn)

    w.EntitiesObserv.Set(p.ID(), p)

	w.AddBlockListener(c)

	c.player = p
	c.Send(&MsgInventoryState{
		Items: c.player.Inventory().ItemsToString(),
	})
}

func (c *Client) Disconnected(g *Game, w *game.World) {
    w.EntitiesObserv.Delete(c.player.ID())
	w.RemoveBlockListener(c)

	c.player.Dispose()
	c.entitySync.Dispose()

	c.conn.Close()

	c.Dispose()
}

func (c *Client) Send(m conn.Message) {
	c.conn.Send(m)
}

func (c *Client) SendLossy(m conn.Message) {
	c.conn.SendLossy(m)
}

func (c *Client) Run(conn *Conn) {
	c.conn.Run(conn)
}

func (c *Client) BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block) {
	c.sendBlockChanged(bc, new)
}

func (c *Client) sendBlockChanged(bc coords.Block, b mapgen.Block) {
	m := &MsgBlock{
		Pos:  bc,
		Type: b,
	}
	select {
	case c.blockSendQueue <- m:
	default:
		c.conn.Error(fmt.Errorf("unable to send block update to player %s (server overloaded?)", c.name))
	}
}

// WARNING: This runs on a seperate thread from everything
// else in client!
func (c *Client) RunChunks(conn *Conn) {
	// This prevents multiple clients from attempting to connect to
	// the same client's RunChunks, which could cause strange
	// race conditions and other problems.
	action := func() {
		c.internalRunChunks(conn)
	}
	c.chunksOnce.Do(action)
}

func (c *Client) internalRunChunks(conn *Conn) {
	for {
		select {
		case m := <-c.blockSendQueue:
			if !c.cm.ApplyBlockChange(m.Pos, m.Type) {
				conn.Send(m)
			}
		default:
			cc, chunk := c.cm.Top()
			if chunk != nil {
				m := &MsgChunk{
					CCPos: cc,
					Size:  coords.ChunkSize,
					Data:  chunk.Flatten(),
				}
				conn.Send(m)
			}
			<-time.After(time.Second / 100)
		}
	}
}