package main

import (
    _ "buildblast/lib/geom"
	"buildblast/lib/game"
	"buildblast/lib/observ"
	"buildblast/lib/observT"
	"fmt"
	"time"
	"math/rand"
)

type SmallSyncStruct struct {
	MoreNums		int
	ObservNum		*observT.Observ_int
}

type BigSyncStruct struct {
	Num		int
	Observ	*Observ_SmallSyncStruct
}

type EntitySync struct {
	observ.DisposeExposedImpl

	world *game.World
	conn  *ClientConn
	testObserv  *BigSyncStruct
}

//Should just use conn to send data, never to receive
func NewEntitySync(world *game.World, conn *ClientConn) *EntitySync {
	fmt.Println("Making entity sync")

	observ.PrintLeaks()

	e := new(EntitySync)
	e.world = world
	e.conn = conn
	
	e.testObserv = &BigSyncStruct{
		Num: 		5,
		Observ: 	NewObserv_SmallSyncStruct(e, SmallSyncStruct{
			MoreNums: 7,
			ObservNum: observT.NewObserv_int(e, 2),
		}),
	}
	
	e.WatchLeaks("EntitySync")

	e.world.EntitiesObserv.OnAdd(e, e.EntityCreated)
	e.world.EntitiesObserv.OnRemove(e, e.EntityRemoved)

	SyncObject(e.conn, e, "hillSphere", e.world.HillSphere)
	
	SyncObject(e.conn, e, "hillColor", e.world.HillColor)
	
	SyncObject(e.conn, e, "Teams", e.world.Teams)
	
	SyncObject(e.conn, e, "KOTH_CONSTS", e.world.KOTH_CONSTS)

	fmt.Println("Syncing testObserv")
	SyncObjectDebug(e.conn, e, "testObserv", e.testObserv, true)
	fmt.Println("Done syncing testObserv")

	return e
}

func (e *EntitySync) TestSync() {
	for {
		select {
		case <-time.After(1 * time.Second):
			if(rand.Float64() > 0.75) {
				//TODO: Make setting an observable call dispose on the previous value if it has a Dispose
				//	(and then set up the SmallSyncStruct to have the correct owner)
				//This probably leaks... because we don't call Dispose on observNum...
				e.testObserv.Observ.Set(SmallSyncStruct{
					MoreNums: rand.Int(),
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
	
	e.conn.Send(&MsgEntityCreate{
		ID:        id,
		Pos:       entity.Pos(),
		Look:      entity.Look(),
		Vy:        entity.Vy(),
		Timestamp: entity.LastUpdated(),
	})

	entity.HealthObserv().OnChanged(e, func(health game.Health) {
		e.conn.Send(&MsgEntityHp{
			ID:     entity.ID(),     //Or id
			Health: health.Points,
		})
	})

	entity.Metrics().OnChanged(e, func(metrics game.Metrics) {
		e.conn.Send(&MsgEntityState{
			ID:        entity.ID(), 
			Pos:       metrics.Pos,
			Look:      metrics.Look,
			Vy:        metrics.Vy,
			Timestamp: metrics.Timestamp,
		})
	})
	
	/*
	entity.TeamName().OnChanged(e, func(teamName string) {
		e.conn.Send(&MsgPropertySet{
			ID: entity.ID(),
			Name: "TeamName",
			Value: teamName,
		})
	})
	*/
}

func (e *EntitySync) EntityRemoved(id string, entity game.Entity) {
	e.conn.Send(&MsgEntityRemove{
		ID: id,
	})
}
