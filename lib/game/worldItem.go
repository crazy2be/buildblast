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

func (wi *WorldItem) State() WorldItemState {
	return wi.worldItemState
}

func (wi *WorldItem) EntityId() EntityId {
	return wi.worldItemState.EntityState.EntityId
}

func (wi *WorldItem) Body() physics.Body {
	return wi.worldItemState.EntityState.Body
}

func (wi *WorldItem) Wpos() coords.World {
	return wi.worldItemState.EntityState.Wpos()
}

func (wi *WorldItem) Look() coords.Direction {
	return wi.worldItemState.EntityState.Look()
}

func (wi *WorldItem) Tick(dt int64, w *World) bool {
	body := wi.Body()
	// These have really low gravity
	body.Vel.Y += float64(dt)/1000 * -0.2

	var closestBody *physics.Body
	var closestDist float64
	for _, b := range w.Biotics() {
		bioticBody := b.Body()
		dist := body.Pos.DistBetween(&bioticBody.Pos)
		if dist < 10.0 {
			if closestBody == nil || dist < closestDist {
				closestBody = &bioticBody
				closestDist = dist
			}
		}
	}

	if closestBody != nil {
		dir := body.Pos.To(&closestBody.Pos)
		dir.Y = 0
		dir.SetLength(100 * (1/(closestDist*closestDist)) * float64(dt) / 1000)
		body.Vel.X = dir.X
		body.Vel.Z = dir.Z
	} else {
		body.Vel.X = 0
		body.Vel.Z = 0
	}

	box := body.Box()
	move := box.AttemptMove(w, body.Vel)

	if move.X == 0 {
		body.Vel.X = 0
	}
	if move.Y == 0 {
		body.Vel.Y = 0
	}
	if move.Z == 0 {
		body.Vel.Z = 0
	}

	if move.X == 0 && move.Y == 0 && move.Z == 0 {
		return false
	}

	body.Vel = move
	body.Pos.Add(&move)
	wi.worldItemState.EntityState.Body = body
	return true;
}
