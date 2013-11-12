package main

import (
    "buildblast/lib/geom"
	"buildblast/lib/game"
	"buildblast/lib/observable"
	"fmt"
)

type EntitySync struct {
	observable.DisposeExposedImpl

	world *game.World
	conn  *ClientConn
}

//Should just use conn to send data, never to receive
func NewEntitySync(world *game.World, conn *ClientConn) *EntitySync {
	fmt.Println("Making entity sync")

	observable.PrintLeaks()

	e := &EntitySync{
		world: world,
		conn:  conn,
	}

	e.WatchLeaks("EntitySync")

	e.world.EntitiesObserv.OnAdd(e, e.EntityCreatedCallback)
	e.world.EntitiesObserv.OnRemove(e, e.EntityRemovedCallback)

    e.world.HillSphere.OnChanged(e, func(n observable.Object, o observable.Object){
        e.conn.Send(&MsgHillMove{
            Sphere:    e.world.HillSphere.Get().(geom.Sphere),
        })
    })
	
    e.world.HillColor.OnChanged(e, func(n observable.Object, o observable.Object){
        e.conn.Send(&MsgHillColorSet{
            Color:    e.world.HillColor.Get().(string),
        })
    })
	
	e.world.Teams.OnAdd(e, e.TeamAddedCallback)
	
	e.world.MaxPoints.OnChanged(e, func(n observable.Object, p observable.Object){
		//This is overkill...
		e.conn.Send(&MsgObjPropSet{
			ObjectName: "KOTH_CONSTS",
		    PropName:	"MaxPoints",
			Value:		e.world.MaxPoints.Get(),
		})
	})

	return e
}


func (e *EntitySync) TeamAddedCallback(key observable.Object, value observable.Object) {
	e.TeamAdded(key.(string), value.(game.Team))
}
func (e *EntitySync) TeamAdded(key string, value game.Team) {
	e.conn.Send(&MsgObjPropSet{
		ObjectName: "Teams",
	    PropName:	key,
		Value:		value,
	})
}

func (e *EntitySync) EntityCreatedCallback(key observable.Object, value observable.Object) {
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

	entity.HealthObserv().OnChanged(e, func(newHealth observable.Object, prevHealth observable.Object) {
		e.conn.Send(&MsgEntityHp{
			ID:     entity.ID(),     //Or id
			Health: entity.Health(), //Or newHealth works too
		})
	})

	entity.Metrics().OnChanged(e, func(new observable.Object, prev observable.Object) {
		e.conn.Send(&MsgEntityState{
			ID:        entity.ID(), 
			Pos:       entity.Pos(),
			Look:      entity.Look(),
			Vy:        entity.Vy(),
			Timestamp: entity.Metrics().Get().(game.Metrics).Timestamp,
		})
	})
	
    entity.HillPoints().OnChanged(e, func(new observable.Object, prev observable.Object) {
        points := entity.HillPoints().Get().(int)
	    e.conn.Send(&MsgHillPointsSet{
	        ID: entity.ID(),
	        Points: points,
	    })
    })
	
	entity.TeamName().OnChanged(e, func(new observable.Object, prev observable.Object) {
		e.conn.Send(&MsgPropertySet{
			ID: entity.ID(),
			Name: "TeamName",
			Value: entity.TeamName().Get(),
		})
	})
}

func (e *EntitySync) EntityRemovedCallback(key observable.Object, value observable.Object) {
	e.EntityRemoved(key.(game.EntityID))
}
func (e *EntitySync) EntityRemoved(id game.EntityID) {
	e.conn.Send(&MsgEntityRemove{
		ID: id,
	})
}
