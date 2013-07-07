package main

import (
	"log"
	"time"
	"reflect"

	"buildblast/coords"
	"buildblast/game"
)

type Client struct {
	*ClientConn

	name string

	// Send the client the right chunks.
	cm *ChunkManager

	player *game.Player
}

func NewClient(name string) *Client {
	c := new(Client)
	c.ClientConn = NewClientConn(name)

	c.name = name

	c.cm = NewChunkManager()

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
				Items: game.ItemsToString(inventory),
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
			c.player.SetActiveItems(m.ItemLeft, m.ItemRight)

		default:
			log.Print("Unknown message recieved from client:", reflect.TypeOf(m))
			return
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
	c.player = p
}

func (c *Client) Disconnected(g *Game, w *game.World) {
	w.RemoveEntity(c.player)
}

// WARNING: This runs on a seperate thread from everything
// else in client! It should be refactored, but for now, just be cautious.
func (c *Client) RunChunks(conn *Conn, world *game.World) {
	for {
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
