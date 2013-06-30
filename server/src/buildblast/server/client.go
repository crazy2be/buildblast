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

func NewClient(world *World, name string) *Client {
	c := new(Client)
	c.ClientConn = NewClientConn(name)

	c.world = world
	c.name = name

	c.cm = NewChunkManager()

	return c
}

func (c *Client) Tick(g *Game, w *World) {
	for {
		select {
		case m := <-c.recvQueue:
			c.handleMessage(g, w, m)
		default:
			return
		}
	}
}

func (c *Client) handleMessage(g *Game, w *World, m Message) {
	switch m.(type) {
		case *MsgBlock:
			m := m.(*MsgBlock)
			w.ChangeBlock(m.Pos, m.Type)
			// TODO: World should broadcast this automatically
			g.Broadcast(m)

		case *MsgControlsState:
			m := m.(*MsgControlsState)
			m.Controls.Timestamp = m.Timestamp

			pos, vy, hp, inventory, hitPos := c.player.ClientTick(m.Controls)

			c.cm.QueueChunksNearby(pos)

			c.Send(&MsgPlayerState{
				Pos: pos,
				VelocityY: vy,
				Timestamp: m.Timestamp,
				Hp: hp,
			})

			c.Send(&MsgInventoryState{
				Items: ItemsToString(inventory),
			})

			if hitPos != nil {
				g.Broadcast(&MsgDebugRay{
					Pos: *hitPos,
				})
			}

		case *MsgChat:
			g.Chat(c.name, m.(*MsgChat).Message)

		case *MsgInventoryState:
			m := m.(*MsgInventoryState)
			c.player.SetActiveItems(Item(m.ItemLeft), Item(m.ItemRight))

		default:
			log.Print("Unknown message recieved from client:", reflect.TypeOf(m))
			return
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
