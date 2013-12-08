package main

import (
    _ "buildblast/lib/geom"
	"buildblast/lib/game"
	"buildblast/lib/observ"
	_ "buildblast/lib/observT"
	"fmt"
	_ "time"
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
	
	e.WatchLeaks("EntitySync")

	e.world.EntitiesObserv.OnAdd(e, e.EntityCreated)
	e.world.EntitiesObserv.OnRemove(e, e.EntityRemoved)

	SyncObject(e.conn, e, "hillSphere", e.world.HillSphere)
	
	SyncObject(e.conn, e, "hillColor", e.world.HillColor)
	
	//e.world.Teams.OnChange(e, e.TeamChanged)
	SyncObject(e.conn, e, "TeamsTest", e.world.Teams)
	
	SyncObject(e.conn, e, "KOTH_CONSTS", e.world.KOTH_CONSTS)

	return e
}

func (e *EntitySync) TeamChanged(key string, value game.Team) {
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
