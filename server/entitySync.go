package main

import (
	"fmt"
	"buildblast/lib/game"
	"buildblast/lib/observable"
)

type EntitySync struct {
	observable.DisposeExposedImpl

	world	*game.World
	conn	*ClientConn
}

//Should just use conn to send data, never to receive
func NewEntitySync(world *game.World, conn *ClientConn) *EntitySync {	
	fmt.Println("Making entity sync")

	observable.PrintLeaks()

	e := &EntitySync{
		world:	world,
		conn:	conn,
	}

	e.WatchLeaks("EntitySync")

	e.world.EntitiesObserv.OnAdd(e, e.EntityCreatedCallback)
	e.world.EntitiesObserv.OnRemove(e, e.EntityCreatedCallback)

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

	player := entity.(*game.Player)

	player.HealthObserv.OnChanged(e, entity, func (newHealth observable.Object, prevHealth observable.Object) {
		e.conn.Send(&MsgEntityHp{
			ID:        player.ID(), //Or id
			Health:    player.Health(), //Or newHealth works too
		})
	})

	player.Metrics.OnChanged(e, entity, func (new observable.Object, prev observable.Object) {
		e.conn.Send(&MsgEntityState{
			ID:			player.ID(), //Or id
			Pos:		new.(game.Metrics).Pos,//player.Pos(),
			Look:		player.Look(),
			Vy:			player.Vy(),
			Timestamp:	new.(game.Metrics).Timestamp,
		})
	})
}

func (e *EntitySync) EntityRemovedCallback(key observable.Object, value observable.Object) {
	e.EntityRemoved(key.(game.EntityID))
}
func (e *EntitySync) EntityRemoved(id game.EntityID){
	e.conn.Send(&MsgEntityRemove{
		ID: id,
	})
}