package game

import (
	"strconv"

	"buildblast/lib/coords"
	"buildblast/lib/physics"
	"buildblast/lib/vmath"
)

var WorldItemHalfExtents = vmath.Vec3{
	float64(1) / 8,
	float64(1) / 8,
	float64(1) / 8,
}

type WorldItem struct {
	worldItemState WorldItemState
}

type WorldItemState struct {
	EntityState EntityState
	ItemKind    Item
}

var globalWorldItemId uint64

func NewWorldItem(kind Item, pos coords.World) *WorldItem {
	globalWorldItemId++
	return &WorldItem{
		worldItemState: WorldItemState{
			EntityState: EntityState{
				EntityId: EntityId("worldItem" + strconv.FormatUint(globalWorldItemId, 10)),
				Body: physics.Body{
					Pos:         pos.Vec3(),
					HalfExtents: WorldItemHalfExtents,
				},
			},
			ItemKind: kind,
		},
	}
}

func (wi WorldItem) State() WorldItemState {
	return wi.worldItemState
}

func (wi WorldItem) EntityId() EntityId {
	return wi.worldItemState.EntityState.EntityId
}

func (wi WorldItem) Body() physics.Body {
	return wi.worldItemState.EntityState.Body
}

func (wi WorldItem) Wpos() coords.World {
	return wi.worldItemState.EntityState.Wpos()
}

func (wi WorldItem) Look() coords.Direction {
	return wi.worldItemState.EntityState.Look()
}
