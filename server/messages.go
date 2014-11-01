package main

import (
	"encoding/json"
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
	"buildblast/lib/vmath"
)

type MessageKind string

const (
	MSG_HANDSHAKE_REPLY   = MessageKind("handshake-reply")
	MSG_HANDSHAKE_ERROR   = MessageKind("handshake-error")
	MSG_SPRITE_CREATE     = MessageKind("sprite-create")
	MSG_SPRITE_STATE      = MessageKind("sprite-state")
	MSG_SPRITE_REMOVE     = MessageKind("sprite-remove")
	MSG_CHUNK             = MessageKind("chunk")
	MSG_BLOCK             = MessageKind("block")
	MSG_CONTROLS_STATE    = MessageKind("controls-state")
	MSG_CHAT              = MessageKind("chat")
	MSG_DEBUG_RAY         = MessageKind("debug-ray")
	MSG_NTP_SYNC          = MessageKind("ntp-sync")
	MSG_INVENTORY_STATE   = MessageKind("inventory-state")
	MSG_INVENTORY_MOVE    = MessageKind("inventory-move")
	MSG_SCOREBOARD_ADD    = MessageKind("scoreboard-add")
	MSG_SCOREBOARD_SET    = MessageKind("scoreboard-set")
	MSG_SCOREBOARD_REMOVE = MessageKind("scoreboard-remove")
	MSG_WORLD_ITEM_ADD    = MessageKind("world-item-add")
	MSG_WORLD_ITEM_REMOVE = MessageKind("world-item-remove")
)

func kindToType(kind MessageKind) Message {
	switch kind {
	case MSG_SPRITE_CREATE:
		return &MsgSpriteCreate{}
	case MSG_SPRITE_STATE:
		return &MsgSpriteState{}
	case MSG_SPRITE_REMOVE:
		return &MsgSpriteRemove{}
	case MSG_BLOCK:
		return &MsgBlock{}
	case MSG_CONTROLS_STATE:
		return &MsgControlsState{}
	case MSG_CHAT:
		return &MsgChat{}
	case MSG_DEBUG_RAY:
		return &MsgDebugRay{}
	case MSG_NTP_SYNC:
		return &MsgNtpSync{}
	case MSG_INVENTORY_STATE:
		return &MsgInventoryState{}
	case MSG_INVENTORY_MOVE:
		return &MsgInventoryMove{}
	case MSG_WORLD_ITEM_ADD:
		return &MsgWorldItemAdd{}
	case MSG_WORLD_ITEM_REMOVE:
		return &MsgWorldItemRemoved{}
	}
	panic("Unknown message recieved from client: " + string(kind))
}

func typeToKind(m Message) MessageKind {
	switch m.(type) {
	case *MsgHandshakeReply:
		return MSG_HANDSHAKE_REPLY
	case *MsgHandshakeError:
		return MSG_HANDSHAKE_ERROR
	case *MsgSpriteCreate:
		return MSG_SPRITE_CREATE
	case *MsgSpriteState:
		return MSG_SPRITE_STATE
	case *MsgSpriteRemove:
		return MSG_SPRITE_REMOVE
	case *MsgChunk:
		return MSG_CHUNK
	case *MsgBlock:
		return MSG_BLOCK
	case *MsgControlsState:
		return MSG_CONTROLS_STATE
	case *MsgChat:
		return MSG_CHAT
	case *MsgDebugRay:
		return MSG_DEBUG_RAY
	case *MsgNtpSync:
		return MSG_NTP_SYNC
	case *MsgInventoryState:
		return MSG_INVENTORY_STATE
	case *MsgInventoryMove:
		return MSG_INVENTORY_MOVE
	case *MsgScoreboardAdd:
		return MSG_SCOREBOARD_ADD
	case *MsgScoreboardSet:
		return MSG_SCOREBOARD_SET
	case *MsgScoreboardRemove:
		return MSG_SCOREBOARD_REMOVE
	case *MsgWorldItemAdd:
		return MSG_WORLD_ITEM_ADD
	case *MsgWorldItemRemoved:
		return MSG_WORLD_ITEM_REMOVE
	}
	panic("Attempted to send unknown message to client: " + reflect.TypeOf(m).String())
}

type MsgHandshakeReply struct {
	ServerTime       float64
	ClientID         string
	PlayerEntityInfo MsgSpriteCreate
	Authenticated    bool
	AuthMessage      string
}

type MsgHandshakeError struct {
	Message string
}

type MsgSpriteCreate struct {
	ID           game.EntityId
	Kind         game.EntityKind
	HalfExtents  vmath.Vec3
	CenterOffset vmath.Vec3
	InitialState game.SpriteState
}

type MsgSpriteState struct {
	ID    game.EntityId
	State game.SpriteState
}

type MsgSpriteRemove struct {
	ID game.EntityId
}

type MsgChunk struct {
	CCPos coords.Chunk
	Size  vmath.Vec3
	// Go is really slow at encoding JSON arrays. This
	// is much faster (and more space efficient)
	Data string
}

type MsgBlock struct {
	Pos  coords.Block
	Type mapgen.Block
}

type MsgControlsState struct {
	Controls game.ControlState
	// JavaScript performance.now() timestamp.
	// TimeStamp is when it was sent, ViewTimestamp is
	// what time the client was displaying when it was sent
	// (with lag induction they may differ).
	Timestamp     float64
	ViewTimestamp float64
}

type MsgChat struct {
	DisplayName string
	Message     string
}

type MsgDebugRay struct {
	Pos coords.World
}

type MsgNtpSync struct {
	ServerTime float64
}

type MsgInventoryState struct {
	// This is a byte array encoded to a string, see ItemsToString() in items.go
	Items     string
	ItemLeft  int
	ItemRight int
}

type MsgInventoryMove struct {
	From int
	To   int
}

type MsgScoreboardAdd struct {
	Name  string
	Score int
}

type MsgScoreboardSet struct {
	Name  string
	Score int
}

type MsgScoreboardRemove struct {
	Name string
}

type ClientMessage struct {
	Kind MessageKind
	// json.RawMessage implements Marshaler and Unmarshaler,
	// so it will NOT be serialized twice.
	Payload json.RawMessage
}

type MsgWorldItemAdd struct {
	ID           game.EntityId
	InitialState game.WorldItemState
}

type MsgWorldItemRemoved struct {
	ID game.EntityId
}

type Message interface{}
