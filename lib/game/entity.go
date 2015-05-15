package game

import (
	"buildblast/lib/coords"
	"buildblast/lib/physics"
	"buildblast/lib/proto"
)

// Should be an int someday...
type EntityId string

type EntityKind string

const (
	EntityKindPlayer    = EntityKind("player")
	EntityKindWorldItem = EntityKind("worldItem")
)

type Entity interface {
	EntityId() EntityId
	Body() physics.Body
	LastUpdated() float64
	Wpos() coords.World
	BoxAt(t float64) *physics.Box
}

type EntityState struct {
	EntityId    EntityId
	Body        physics.Body
	LastUpdated float64
}

func (es *EntityState) Wpos() coords.World {
	return coords.World(es.Body.Pos)
}

func (es *EntityState) Look() coords.Direction {
	return coords.Direction(es.Body.Dir)
}

func (es *EntityState) ToProto() []byte {
	buf := make([]byte, 256)
	buf = append(buf, proto.MarshalString(es.EntityId)...)
	buf = append(buf, es.Body.ToProto()...)
	buf = append(buf, proto.MarshalFloat64(es.LastUpdated)...)
	return buf
}

func (es *EntityState) FromProto(buf []byte) (int, error) {
	var offset int
	es.EntityId, offset = proto.UnmarshalString(buf)
	read, err := es.Body.FromProto(buf[offset:])
	offset += read
	if err != nil {
		return 0, err
	}
	es.LastUpdated, read = proto.UnmarshalFloat64(buf[offset:])
	offset += read
	return offset, nil
}

type Damageable interface {
	Life() int
	Dead() bool

	Damage(amount int)
}

type Health struct {
	Life int
}

type Possessor interface {
	Inventory() *Inventory
	Give(item Item) bool
	Take(item Item) bool

	// Do items in the world gravitate towards this?
	Collects() bool
	// If Collects return true, then Body must return a value
	Body() physics.Body
}

type Respawnable interface {
	Respawn(pos coords.World)
}

type Biotic interface {
	Entity
	Damageable
	Respawnable

	State() BioticState
}

type BioticState struct {
	EntityState EntityState
	Health      Health
}
