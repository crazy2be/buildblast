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

	return e
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
        //We can't trust newPoints...
        points := entity.HillPoints().Get().(int)
	    e.conn.Send(&MsgHillPointsSet{
	        ID: entity.ID(),
	        Points: points,
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
