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
	fmt.Println("Sending entity created to client")
	e.conn.Send(&MsgEntityCreate{
		ID:        id,
		Pos:       entity.Pos(),
		Look:      entity.Look(),
		Health:    entity.Health(),
		Vy:        entity.Vy(),
		Timestamp: entity.LastUpdated(),
	})

	player := entity.(*game.Player)

	//TODO, pass in entity instead or EntitySync
	player.HealthObserv.OnChanged(e, func (newHealth observable.Object, prevHealth observable.Object) {
		e.conn.Send(&MsgEntityState{
			ID:        player.ID(), //Or id
			Pos:       player.Pos(),
			Look:      player.Look(),
			Health:    player.Health(), //Or newHealth works too
			Vy:        player.Vy(),
			Timestamp: player.LastUpdated(),
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

func (e *EntitySync) EntityDamaged(id game.EntityID, entity game.Entity) {}
func (e *EntitySync) EntityDied(id game.EntityID, entity game.Entity, killer string){}