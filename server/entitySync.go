package main

import (
    "buildblast/lib/geom"
	"buildblast/lib/game"
	"buildblast/lib/observ"
	_ "buildblast/lib/observT"
	"fmt"
	"time"
	_ "math/rand"
)

type EntitySync struct {
	observ.DisposeExposedImpl

	world *game.World
	conn  *ClientConn
	//testObserv  *observT.Observ_int
}

//Should just use conn to send data, never to receive
func NewEntitySync(world *game.World, conn *ClientConn) *EntitySync {
	fmt.Println("Making entity sync")

	observ.PrintLeaks()

	e := new(EntitySync)
	e.world = world
	e.conn = conn
	
	//e.testObserv = observT.NewObserv_int(e, 5)

	//SyncObserv(e.conn, e, "testObserv", e.testObserv.GetBase())

	e.WatchLeaks("EntitySync")

	e.world.EntitiesObserv.OnAdd(e, e.EntityCreated)
	e.world.EntitiesObserv.OnRemove(e, e.EntityRemoved)

    e.world.HillSphere.OnChanged(e, func(sphere geom.Sphere){
        e.conn.Send(&MsgHillMove{
            Sphere:   sphere,
        })
    })
	
    e.world.HillColor.OnChanged(e, func(color string){
        e.conn.Send(&MsgHillColorSet{
            Color:    color,
        })
    })
	
	e.world.Teams.OnAdd(e, e.TeamAdded)
	
	//SyncObject(e.conn, e, "testObserv2", e.testObserv.GetBase())
	SyncObject(e.conn, e, "KOTH_CONSTS", e.world.KOTH_CONSTS)
	
	/*
	e.world.KOTH_CONSTS.MaxPoints.OnChanged(e, func(maxPoints int){
		e.conn.Send(&MsgObjPropSet{
			ObjectName: "KOTH_CONSTS",
		    PropName:	"MaxPoints",
			Value:		maxPoints,
		})
	})
	*/

	go e.TestFnc()

	return e
}

func (e *EntitySync) TestFnc() {
	type TestData struct{
		Truth	bool
		Text	string
		Num 	float64
	}
	
	for {
		select {
	    case <-time.After(1000 * time.Millisecond):
			//e.testObserv.Set(rand.Int())
			/*
			e.conn.Send(&MsgKoIntegrate{
				Name: "TestData.nested.alot",
				Value: TestData {
					Truth: true,
					Text: "texty",
					Num: rand.Float64(),
				},
			})
			*/
	    }
	}
}


func (e *EntitySync) TeamAdded(key string, value game.Team) {
	e.conn.Send(&MsgObjPropSet{
		ObjectName: "Teams",
	    PropName:	key,
		Value:		value,
	})
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
	
	entity.TeamName().OnChanged(e, func(teamName string) {
		e.conn.Send(&MsgPropertySet{
			ID: entity.ID(),
			Name: "TeamName",
			Value: teamName,
		})
	})
}

func (e *EntitySync) EntityRemoved(id string, entity game.Entity) {
	e.conn.Send(&MsgEntityRemove{
		ID: id,
	})
}
