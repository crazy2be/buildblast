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
	"buildblast/lib/proto"
)

type Client struct {
	conn *ClientConn

	name string

	// Send the client the right chunks.
	cm             *ChunkManager
	blockSendQueue chan *proto.MsgBlock
	chunksOnce     sync.Once

	player *game.Player
}

func NewClient(name string) *Client {
	c := new(Client)
	c.conn = NewClientConn(name)

	c.name = name

	c.cm = NewChunkManager()
	c.blockSendQueue = make(chan *proto.MsgBlock, 10)

	return c
}

func (c *Client) Tick(g *Game, w *game.World) {
conn:
	for {
		select {
		case m := <-c.conn.recvQueue:
			c.handleMessage(g, w, m)
		case e := <-c.conn.errorQueue:
			g.disconnect(c.name, e.Error())
			return
		default:
			break conn
		}
	}
	if c.player.NeedsInventoryUpdate() {
		c.Send(&proto.MsgInventoryState{
			Items: c.player.Inventory().ItemsToByteArray(),
		})
		c.player.ClientInventoryUpdated()
	}
}

func (c *Client) handleMessage(g *Game, w *game.World, m proto.Message) {
	switch m.(type) {
	case *proto.MsgBlock:
		m := m.(*proto.MsgBlock)
		c.handleBlock(g, w, m)

	case *proto.MsgControlsState:
		m := m.(*proto.MsgControlsState)
		c.handleControlState(g, w, m)

	case *proto.MsgChatSend:
		g.Chat(c.name, m.(*proto.MsgChatSend).Message)

	case *proto.MsgInventorySelect:
		m := m.(*proto.MsgInventorySelect)
		c.player.Inventory().SetActiveItems(m.ItemLeft, m.ItemRight)

	case *proto.MsgInventoryMove:
		m := m.(*proto.MsgInventoryMove)
		c.player.Inventory().MoveItems(m.From, m.To)

		c.Send(&proto.MsgInventoryState{
			Items: c.player.Inventory().ItemsToByteArray(),
		})

	default:
		c.conn.Error(fmt.Errorf("unknown message recieved from client: %s, %s", reflect.TypeOf(m), m))
	}
}

func (c *Client) handleBlock(g *Game, w *game.World, m *proto.MsgBlock) {
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
		w.AddEntity(game.NewWorldItem(item, m.Pos.Center()))
		w.ChangeBlock(m.Pos, mapgen.BLOCK_AIR)
	}

	c.Send(&proto.MsgInventoryState{
		Items: c.player.Inventory().ItemsToByteArray(),
	})
}

func (c *Client) handleControlState(g *Game, w *game.World, m *proto.MsgControlsState) {
	hitPos := c.player.ClientTick(m.Controls)

	c.cm.QueueChunksNearby(w, c.player.Wpos())

	if hitPos != nil {
		g.Broadcast(&proto.MsgDebugRay{
			Pos: *hitPos,
		})
	}
}

func (c *Client) Connected(g *Game, w *game.World) {
	p := game.NewPlayer(w, c.name)

	for id, b := range w.Biotics() {
		c.BioticCreated(id, b)
		c.Send(&proto.MsgScoreboardAdd{
			Name:  string(id),
			Score: g.scores[string(id)],
		})
	}

	for id, wi := range w.WorldItems() {
		c.WorldItemAdded(id, wi)
	}

	w.AddEntity(p)

	w.AddBlockListener(c)
	w.AddBioticListener(c)
	w.AddWorldItemListener(c)

	c.player = p
	c.Send(&proto.MsgInventoryState{
		Items: c.player.Inventory().ItemsToByteArray(),
	})
}

func (c *Client) Disconnected(g *Game, w *game.World) {
	w.RemoveEntity(c.player)
	w.RemoveBlockListener(c)
	w.RemoveBioticListener(c)
	w.RemoveWorldItemListener(c)
	c.conn.Close()
}

func (c *Client) Send(m proto.Message) {
	c.conn.Send(m)
}

func (c *Client) SendLossy(m proto.Message) {
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
	c.SendLossy(&proto.MsgEntityState{
		ID:    id,
		Kind:  game.EntityKindPlayer,
		State: biotic.State(),
	})
}

func (c *Client) BioticDamaged(id game.EntityId, biotic game.Biotic) {
	c.BioticUpdated(id, biotic)
}

func (c *Client) BioticDied(id game.EntityId, biotic game.Biotic, killer string) {
	c.BioticUpdated(id, biotic)
}

func (c *Client) BioticRemoved(id game.EntityId) {
	c.Send(&proto.MsgEntityRemove{
		ID: id,
	})
}

func (c *Client) WorldItemAdded(id game.EntityId, worldItem *game.WorldItem) {
	c.Send(&proto.MsgEntityCreate{
		ID:    id,
		Kind:  game.EntityKindWorldItem,
		State: worldItem.State(),
	})
}

func (c *Client) WorldItemUpdated(id game.EntityId, worldItem *game.WorldItem) {
	c.Send(&proto.MsgEntityState{
		ID:    id,
		Kind:  game.EntityKindWorldItem,
		State: worldItem.State(),
	})
}

func (c *Client) WorldItemRemoved(id game.EntityId) {
	c.Send(&proto.MsgEntityRemove{
		ID: id,
	})
}

func (c *Client) sendBlockChanged(bc coords.Block, b mapgen.Block) {
	m := &proto.MsgBlock{
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
				m := &proto.MsgChunk{
					CCPos: cc,
					Size:  coords.ChunkSize,
					Data:  chunk.ToByteArray(),
				}
				conn.Send(m)
			}
			<-time.After(time.Second / 100)
		}
	}
}

func makePlayerEntityCreatedMessage(id game.EntityId, state *game.BioticState) *proto.MsgEntityCreate {
	return &proto.MsgEntityCreate{
		ID:    id,
		Kind:  game.EntityKindPlayer,
		State: state,
	}
}
