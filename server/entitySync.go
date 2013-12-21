package main

import (
	"buildblast/lib/game"
	_ "buildblast/lib/geom"
	"buildblast/lib/observ"
	"buildblast/lib/observT"
	"fmt"
	"math/rand"
	"time"
)

type SmallSyncStruct struct {
	MoreNums  int
	ObservNum *observT.Observ_int
}

type BigSyncStruct struct {
	Num    int
	Observ *Observ_SmallSyncStruct
}

type EntitySync struct {
	observ.DisposeExposedImpl

	world      *game.World
	conn       *ClientConn
	testObserv *BigSyncStruct
}

//Should just use conn to send data, never to receive
func NewEntitySync(world *game.World, conn *ClientConn) *EntitySync {
	fmt.Println("Making entity sync")

	observ.PrintLeaks()

	e := new(EntitySync)
	e.world = world
	e.conn = conn

	e.testObserv = &BigSyncStruct{
		Num: 5,
		Observ: NewObserv_SmallSyncStruct(e, SmallSyncStruct{
			MoreNums:  7,
			ObservNum: observT.NewObserv_int(e, 2),
		}),
	}

	e.WatchLeaks("EntitySync")

	e.world.EntitiesObserv.OnAdd(e, e.EntityCreated)

	SyncObject(e.conn, e, "hillSphere", e.world.HillSphere)

	SyncObject(e.conn, e, "hillColor", e.world.HillColor)

	SyncObject(e.conn, e, "Teams", e.world.Teams)

	SyncObject(e.conn, e, "KOTH_CONSTS", e.world.KOTH_CONSTS)

	SyncObjectDebug(e.conn, e, "Entities", e.world.EntitiesObserv, true)

	SyncObject(e.conn, e, "testObserv", e.testObserv)

	go e.TestSync()

	return e
}

func (e *EntitySync) TestSync() {
	for {
		select {
		case <-time.After(100 * time.Millisecond):
			if rand.Float64() > 0.75 && false {
				//TODO: Make setting an observable call dispose on the previous value if it has a Dispose
				//	(and then set up the SmallSyncStruct to have the correct owner)
				//This probably leaks... because we don't call Dispose on observNum...
				e.testObserv.Observ.Set(SmallSyncStruct{
					MoreNums:  rand.Int(),
					ObservNum: observT.NewObserv_int(e, rand.Int()),
				})
			} else {
				smallSync := e.testObserv.Observ.Get()
				smallSync.ObservNum.Set(rand.Int())
			}
		}
	}
}

func (e *EntitySync) EntityCreated(id string, entity game.Entity) {
	fmt.Println("Sending entity created", id, "to client")

	//Hmm... I want to leave this here just to prove you don't have to use
	//SyncObject... but when this is optimized I might as well just optimize
	//SyncObject, meaning this won't be able to be independent...
	entity.GetMetrics().OnChanged(e, func(metrics game.Metrics) {
		e.conn.Send(&MsgEntityState{
			ID:        entity.ID(),
			Pos:       metrics.Pos,
			Look:      metrics.Look,
			Vy:        metrics.Vy,
			Timestamp: metrics.Timestamp,
		})
	})
}
