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

	e.WatchLeaks("EntitySync")

	e.world.EntitiesObserv.OnAdd(e, e.EntityCreatedCallback)
	e.world.EntitiesObserv.OnRemove(e, e.EntityRemovedCallback)

    e.world.HillSphere.OnChanged(e, func(n observ.Object){
        e.conn.Send(&MsgHillMove{
            Sphere:    e.world.HillSphere.Get().(geom.Sphere),
        })
    })
	
    e.world.HillColor.OnChanged(e, func(n observ.Object){
        e.conn.Send(&MsgHillColorSet{
            Color:    e.world.HillColor.Get().(string),
        })
    })
	
	e.world.Teams.OnAdd(e, e.TeamAddedCallback)
	
	e.world.MaxPoints.OnChanged(e, func(n observ.Object){
		//This is overkill...
		e.conn.Send(&MsgObjPropSet{
			ObjectName: "KOTH_CONSTS",
		    PropName:	"MaxPoints",
			Value:		e.world.MaxPoints.Get(),
		})
	})

	return e
}


func (e *EntitySync) TeamAddedCallback(key observ.Object, value observ.Object) {
	e.TeamAdded(key.(string), value.(game.Team))
}
func (e *EntitySync) TeamAdded(key string, value game.Team) {
	e.conn.Send(&MsgObjPropSet{
		ObjectName: "Teams",
	    PropName:	key,
		Value:		value,
	})
}

func (e *EntitySync) EntityCreatedCallback(key observ.Object, value observ.Object) {
	e.EntityCreated(key.(game.EntityID), value.(game.Entity))
}
func (e *EntitySync) EntityCreated(id game.EntityID, entity game.Entity) {
	fmt.Println("Sending entity created", id, "to client")
	
	e.conn.Send(&MsgEntityCreate{
		ID:        id,
		Pos:       entity.Pos(),
		Look:      entity.Look(),
		Vy:        entity.Vy(),
		Timestamp: entity.LastUpdated(),
	})

	entity.HealthObserv().OnChanged(e, func(newHealth observ.Object) {
		e.conn.Send(&MsgEntityHp{
			ID:     entity.ID(),     //Or id
			Health: entity.Health(), //Or newHealth works too
		})
	})

	entity.Metrics().OnChanged(e, func(new observ.Object) {
		e.conn.Send(&MsgEntityState{
			ID:        entity.ID(), 
			Pos:       entity.Pos(),
			Look:      entity.Look(),
			Vy:        entity.Vy(),
			Timestamp: entity.Metrics().Get().(game.Metrics).Timestamp,
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

func (e *EntitySync) EntityRemovedCallback(key observ.Object, value observ.Object) {
	e.EntityRemoved(key.(game.EntityID))
}
func (e *EntitySync) EntityRemoved(id game.EntityID) {
	e.conn.Send(&MsgEntityRemove{
		ID: id,
	})
}
