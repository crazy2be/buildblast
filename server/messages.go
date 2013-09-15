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
	MSG_ENTITY_TICK		= MessageKind("entity-tick")
	MSG_ENTITY_CREATE   = MessageKind("entity-create")
	MSG_ENTITY_REMOVE   = MessageKind("entity-remove")
	MSG_CHUNK           = MessageKind("chunk")
	MSG_BLOCK           = MessageKind("block")
	MSG_CONTROLS_STATE  = MessageKind("controls-state")
	MSG_CHAT            = MessageKind("chat")
	MSG_PLAYER_STATE    = MessageKind("player-state")
	MSG_DEBUG_RAY       = MessageKind("debug-ray")
	MSG_NTP_SYNC        = MessageKind("ntp-sync")
	MSG_INVENTORY_STATE = MessageKind("inventory-state")
	MSG_INVENTORY_MOVE  = MessageKind("inventory-move")
)

func kindToType(kind MessageKind) Message {
	switch kind {
	case MSG_HANDSHAKE_INIT:
		return &MsgHandshakeInit{}
	case MSG_ENTITY_TICK:
		return &game.TickData{}
	case MSG_ENTITY_CREATE:
		return &MsgEntityCreate{}
	case MSG_ENTITY_REMOVE:
		return &MsgEntityRemove{}
	case MSG_BLOCK:
		return &MsgBlock{}
	case MSG_CONTROLS_STATE:
		return &MsgControlsState{}
	case MSG_CHAT:
		return &MsgChat{}
	case MSG_PLAYER_STATE:
		return &MsgPlayerState{}
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
	case game.TickData:
		return MSG_ENTITY_TICK
	case *MsgEntityCreate:
		return MSG_ENTITY_CREATE
	case *MsgEntityRemove:
		return MSG_ENTITY_REMOVE
	case *MsgChunk:
		return MSG_CHUNK
	case *MsgBlock:
		return MSG_BLOCK
	case *MsgControlsState:
		return MSG_CONTROLS_STATE
	case *MsgChat:
		return MSG_CHAT
	case *MsgPlayerState:
		return MSG_PLAYER_STATE
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

type MsgEntityCreate struct {
	ID string
}

type MsgEntityRemove struct {
	ID string
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
	Timestamp float64
}

type MsgChat struct {
	DisplayName string
	Message     string
}

type MsgPlayerState struct {
	Pos       coords.World
	VelocityY float64
	// JavaScript performance.now() timestamp.
	Timestamp float64
	Hp        int
}

type MsgDebugRay struct {
	Pos coords.World
}

type MsgNtpSync struct {
	ServerTime float64
}

type MsgInventoryState struct {
	Items     string // This is a byte array encoded to a string, see ItemsToString() in items.go
	ItemLeft  int
	ItemRight int
}

type MsgInventoryMove struct {
	From int
	To   int
}

type ClientMessage struct {
	Kind    MessageKind
	Payload json.RawMessage
}

type Message interface{}
