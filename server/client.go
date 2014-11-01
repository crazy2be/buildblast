package main

import (
	"fmt"
	"log"
	"reflect"
	"sync"
	"time"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
)

type Client struct {
	conn *ClientConn

	name string

	// Send the client the right chunks.
	cm             *ChunkManager
	blockSendQueue chan *MsgBlock
	chunksOnce     sync.Once

	player *game.Player
}

func NewClient(name string) *Client {
	c := new(Client)
	c.conn = NewClientConn(name)

	c.name = name

	c.cm = NewChunkManager()
	c.blockSendQueue = make(chan *MsgBlock, 10)

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

func (c *Client) handleMessage(g *Game, w *game.World, m Message) {
	switch m.(type) {
	case *MsgBlock:
		m := m.(*MsgBlock)
		c.handleBlock(g, w, m)

	case *MsgControlsState:
		m := m.(*MsgControlsState)
		m.Controls.Timestamp = m.Timestamp
		m.Controls.ViewTimestamp = m.ViewTimestamp
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
		c.conn.Error(fmt.Errorf("unknown message recieved from client: %s", reflect.TypeOf(m)))
	}
}

func (c *Client) handleBlock(g *Game, w *game.World, m *MsgBlock) {
	// Eventually we should simulate block placement/removal entirely
	// on the server side, but for now, this works fairly well.
	inv := c.player.Inventory()
	curBlock := w.Block(m.Pos)

	if curBlock == mapgen.BLOCK_AIR {
		// If we are changing AIR to AIR (caused by a race condition) ignore it.
		if m.Type == mapgen.BLOCK_AIR {
			return
		}
		// Placing a block
		item := game.ItemFromBlock(m.Type)
		if inv.RemoveItem(item) {
			w.ChangeBlock(m.Pos, m.Type)
		} else {
			log.Println("Rejecting attempt to place block that is not in inventory!")
			c.sendBlockChanged(m.Pos, curBlock)
		}
	} else {
		if !curBlock.Mineable() {
			log.Println("Attempt to mine unmineable block rejected!")
			c.sendBlockChanged(m.Pos, curBlock)
			return
		}
		// Removing a block
		item := game.ItemFromBlock(curBlock)
		w.AddWorldItem(game.NewWorldItem(item, m.Pos.Center()))
		w.ChangeBlock(m.Pos, mapgen.BLOCK_AIR)
	}

	c.Send(&MsgInventoryState{
		Items: c.player.Inventory().ItemsToString(),
	})
}

func (c *Client) handleControlState(g *Game, w *game.World, m *MsgControlsState) {
	hitPos := c.player.ClientTick(m.Controls)

	c.cm.QueueChunksNearby(w, c.player.Wpos())

	if hitPos != nil {
		g.Broadcast(&MsgDebugRay{
			Pos: *hitPos,
		})
	}
}

func (c *Client) Connected(g *Game, w *game.World) {
	p := game.NewPlayer(w, c.name)

	for id, s := range w.Biotics() {
		c.BioticCreated(id, s)
		c.Send(&MsgScoreboardAdd{
			Name:  string(id),
			Score: g.scores[string(id)],
		})
	}

	w.AddBiotic(p)

	w.AddBlockListener(c)
	w.AddBioticListener(c)
	w.AddWorldItemListener(c)

	c.player = p
	c.Send(&MsgInventoryState{
		Items: c.player.Inventory().ItemsToString(),
	})
}

func (c *Client) Disconnected(g *Game, w *game.World) {
	w.RemoveBiotic(c.player)
	w.RemoveBlockListener(c)
	w.RemoveBioticListener(c)
	w.RemoveWorldItemListener(c)
	c.conn.Close()
}

func (c *Client) Send(m Message) {
	c.conn.Send(m)
}

func (c *Client) SendLossy(m Message) {
	c.conn.SendLossy(m)
}

func (c *Client) Run(conn *Conn) {
	c.conn.Run(conn)
}

func (c *Client) BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block) {
	c.sendBlockChanged(bc, new)
}

func (c *Client) BioticCreated(id game.EntityId, biotic game.Biotic) {
	c.Send(makePlayerEntityCreatedMessage(id, biotic.State()))
}

func (c *Client) BioticUpdated(id game.EntityId, biotic game.Biotic) {
	c.SendLossy(&MsgBioticState{
		ID:          id,
		Kind:        game.EntityKindPlayer,
		BioticState: biotic.State(),
	})
}

func (c *Client) BioticDamaged(id game.EntityId, biotic game.Biotic) {
	c.BioticUpdated(id, biotic)
}

func (c *Client) BioticDied(id game.EntityId, biotic game.Biotic, killer string) {
	c.BioticUpdated(id, biotic)
}

func (c *Client) BioticRemoved(id game.EntityId) {
	c.Send(&MsgBioticRemove{
		ID: id,
	})
}

func (c *Client) WorldItemAdded(id game.EntityId, worldItem *game.WorldItem) {
	c.Send(&MsgWorldItemAdd{
		ID:             id,
		WorldItemState: worldItem.State(),
	})
}

func (c *Client) WorldItemRemoved(id game.EntityId) {
	c.Send(&MsgWorldItemRemoved{
		ID: id,
	})
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

func makePlayerEntityCreatedMessage(id game.EntityId, state game.BioticState) *MsgBioticCreate {
	return &MsgBioticCreate{
		ID:          id,
		Kind:        game.EntityKindPlayer,
		BioticState: state,
	}
}
