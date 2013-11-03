package main

import (
	"encoding/json"
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
)

type MessageKind string

const (
	MSG_HANDSHAKE_INIT  = MessageKind("handshake-init")
	MSG_HANDSHAKE_REPLY = MessageKind("handshake-reply")
	MSG_HANDSHAKE_ERROR = MessageKind("handshake-error")
	MSG_ENTITY_CREATE   = MessageKind("entity-create")
	MSG_ENTITY_STATE    = MessageKind("entity-state")
	MSG_ENTITY_REMOVE   = MessageKind("entity-remove")
	MSG_ENTITY_HP		= MessageKind("entity-hp")
	MSG_CHUNK           = MessageKind("chunk")
	MSG_BLOCK           = MessageKind("block")
	MSG_CONTROLS_STATE  = MessageKind("controls-state")
	MSG_CHAT            = MessageKind("chat")
	MSG_DEBUG_RAY       = MessageKind("debug-ray")
	MSG_NTP_SYNC        = MessageKind("ntp-sync")
	MSG_INVENTORY_STATE = MessageKind("inventory-state")
	MSG_INVENTORY_MOVE  = MessageKind("inventory-move")
)

func kindToType(kind MessageKind) Message {
	switch kind {
	case MSG_HANDSHAKE_INIT:
		return &MsgHandshakeInit{}
	case MSG_ENTITY_CREATE:
		return &MsgEntityCreate{}
	case MSG_ENTITY_STATE:
		return &MsgEntityState{}
	case MSG_ENTITY_REMOVE:
		return &MsgEntityRemove{}
	case MSG_ENTITY_HP:
		return &MsgEntityHp{}
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
	}
	panic("Unknown message recieved from client: " + string(kind))
}

func typeToKind(m Message) MessageKind {
	switch m.(type) {
	case *MsgHandshakeReply:
		return MSG_HANDSHAKE_REPLY
	case *MsgHandshakeError:
		return MSG_HANDSHAKE_ERROR
	case *MsgEntityCreate:
		return MSG_ENTITY_CREATE
	case *MsgEntityState:
		return MSG_ENTITY_STATE
	case *MsgEntityRemove:
		return MSG_ENTITY_REMOVE
	case *MsgEntityHp:
		return MSG_ENTITY_HP
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
	}
	panic("Attempted to send unknown message to client: " + reflect.TypeOf(m).String())
}

type MsgHandshakeInit struct {
	DesiredName string
}

type MsgHandshakeReply struct {
	ServerTime float64
	ClientID   string
}

type MsgHandshakeError struct {
	Message string
}

// We want the entity to have a valid
// state when we first create it.
type MsgEntityCreate MsgEntityState

type MsgEntityState struct {
	ID        game.EntityID
	Pos       coords.World
	Look      coords.Direction
	Vy        float64
	Timestamp float64
}

type MsgEntityRemove struct {
	ID game.EntityID
}

type MsgEntityHp struct {
	ID game.EntityID
	Health		int
}

type MsgChunk struct {
	CCPos coords.Chunk
	Size  coords.Vec3
	// Go is really slow at encoding arrays. This
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

type ClientMessage struct {
	Kind MessageKind
	// json.RawMessage implements Marshaler and Unmarshaler,
	// so it will NOT be serialized twice.
	Payload json.RawMessage
}

type Message interface{}
