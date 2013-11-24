package main

import (
    "buildblast/lib/geom"
	"buildblast/lib/game"
	"buildblast/lib/observ"
	"fmt"
)

type EntitySync struct {
	observ.DisposeExposedImpl

	world *game.World
	conn  *ClientConn
}



//Should just use conn to send data, never to receive
func NewEntitySync(world *game.World, conn *ClientConn) *EntitySync {
	fmt.Println("Making entity sync")

	observ.PrintLeaks()

	e := &EntitySync{
		world: world,
		conn:  conn,
	}
	
	type TestData struct{
		Truth	bool
		Text	string
		Num 	float64
	}
	
	e.conn.Send(&MsgKoIntegrate{
		Name: "TestData",
		Value: TestData {
			Truth: true,
			Text: "texty",
			Num: 5.234032,
		},
	});

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
	
	e.world.MaxPoints.OnChanged(e, func(maxPoints int){
		//This is overkill...
		e.conn.Send(&MsgObjPropSet{
			ObjectName: "KOTH_CONSTS",
		    PropName:	"MaxPoints",
			Value:		maxPoints,
		})
	})

	return e
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
