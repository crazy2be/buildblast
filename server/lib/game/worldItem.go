package game

import (
	"strconv"
	"time"

	"buildblast/server/lib/coords"
	"buildblast/server/lib/physics"
	"buildblast/server/lib/vmath"
)

var WorldItemHalfExtents = vmath.Vec3{
	float64(1) / 8,
	float64(1) / 8,
	float64(1) / 8,
}

type WorldItem struct {
	worldItemState WorldItemState
	history        *HistoryBuffer
	lastUpdated    float64
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
		history: NewHistoryBuffer(),
	}
}

func (wi *WorldItem) State() *WorldItemState {
	return &wi.worldItemState
}

// Entity interface

func (wi *WorldItem) EntityId() EntityId {
	return wi.worldItemState.EntityState.EntityId
}

func (wi *WorldItem) Body() physics.Body {
	return wi.worldItemState.EntityState.Body
}

func (wi *WorldItem) LastUpdated() float64 {
	return wi.lastUpdated
}

func (wi *WorldItem) Wpos() coords.World {
	return wi.worldItemState.EntityState.Wpos()
}

func (wi *WorldItem) Look() coords.Direction {
	return wi.worldItemState.EntityState.Look()
}

func (wi *WorldItem) BoxAt(t float64) *physics.Box {
	return wi.history.BodyAt(t).Box()
}

// End Entity interface

// Returns "updated" and "pickedUp", in that order
func (wi *WorldItem) Tick(dt int64, w *World) (bool, bool) {
	body := wi.Body()
	// These have really low gravity
	body.Vel.Y += float64(dt) / 1000 * -0.2

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
		dir.SetLength(30 * (1 / closestDist) * float64(dt) / 1000)
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

	var updated bool
	if move.X == 0 && move.Y == 0 && move.Z == 0 {
		updated = false
	} else {
		body.Vel = move
		body.Pos.Add(&move)
		wi.worldItemState.EntityState.Body = body
		updated = true
	}
	wi.lastUpdated = float64(time.Now().UnixNano()) / 1e6
	wi.history.Add(wi.LastUpdated(), wi.Body())

	pickedUp := false
	for _, possessor := range w.possessors {
		if !possessor.Collects() {
			continue
		}
		pBody := possessor.Body()
		wiBody := wi.Body()
		if pBody.Box().Collides(wiBody.Box()) {
			possessor.Give(wi.State().ItemKind)
			pickedUp = true
			break
		}
	}

	return updated, pickedUp
}
