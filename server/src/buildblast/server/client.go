package main

import (
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
	blockSendQueue chan *MsgBlock

	player *game.Player
}

func NewClient(name string) *Client {
	c := new(Client)
	c.ClientConn = NewClientConn(name)

	c.name = name

	c.cm = NewChunkManager()
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
		c.handleBlock(g, w, m)

	case *MsgControlsState:
		m := m.(*MsgControlsState)
		m.Controls.Timestamp = m.Timestamp
		c.handleControlState(g, w, m)

	case *MsgChat:
		g.Chat(c.name, m.(*MsgChat).Message)

	case *MsgInventoryState:
		m := m.(*MsgInventoryState)
		c.player.Inventory().SetActiveItems(m.ItemLeft, m.ItemRight)

	case *MsgInventoryMove:
		m := m.(*MsgInventoryMove)
		c.player.Inventory().MoveItems(m.From, m.To)

		c.Send(&MsgInventoryState{
			Items: c.player.Inventory().ItemsToString(),
		})

	default:
		c.Errors <- fmt.Errorf("unknown message recieved from client: %s", reflect.TypeOf(m))
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
		w.ChangeBlock(m.Pos, m.Type)
	}

	c.Send(&MsgInventoryState{
		Items: c.player.Inventory().ItemsToString(),
	})
}

func (c *Client) handleControlState(g *Game, w *game.World, m *MsgControlsState) {
	pos, vy, hp, hitPos := c.player.ClientTick(m.Controls)

	c.cm.QueueChunksNearby(w, pos)

	c.Send(&MsgPlayerState{
		Pos: pos,
		VelocityY: vy,
		Timestamp: m.Timestamp,
		Hp: hp,
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
	c.Send(&MsgInventoryState{
		Items: c.player.Inventory().ItemsToString(),
	})
}

func (c *Client) Disconnected(g *Game, w *game.World) {
	w.RemoveEntity(c.player)
	w.RemoveBlockListener(c)
}

func (c *Client) BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block) {
	c.sendBlockChanged(bc, new)
}

func (c *Client) sendBlockChanged(bc coords.Block, b mapgen.Block) {
	m := &MsgBlock{
		Pos: bc,
		Type: b,
	}
	select {
	case c.blockSendQueue <- m:
	default:
		c.Errors <- fmt.Errorf("unable to send block update to player %s (server overloaded?)", c.name)
	}
}

// WARNING: This runs on a seperate thread from everything
// else in client!
func (c *Client) RunChunks(conn *Conn) {
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
					Size: coords.ChunkSize,
					Data: chunk.Flatten(),
				}
				conn.Send(m)
			}
			<-time.After(time.Second / 100)
		}
	}
}
