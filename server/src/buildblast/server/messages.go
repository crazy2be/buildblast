package main

import (
	"encoding/json"

	"buildblast/coords"
	"buildblast/mapgen"
)

type MessageKind string

const (
	MSG_ENTITY_CREATE   = MessageKind("entity-create")
	MSG_ENTITY_POSITION = MessageKind("entity-position")
	MSG_ENTITY_REMOVE   = MessageKind("entity-remove")
	MSG_CHUNK           = MessageKind("chunk")
	MSG_BLOCK           = MessageKind("block")
	MSG_PLAYER_POSITION = MessageKind("player-position")
	MSG_CONTROLS_STATE  = MessageKind("controls-state")
	MSG_CHAT            = MessageKind("chat")
)

type MsgEntityCreate struct {
	ID string
}

type MsgEntityPosition struct {
	Pos   coords.World
	Rot   coords.Vec3
	ID    string
}

type MsgEntityRemove struct {
	ID string
}

type MsgChunk struct {
	CCPos coords.Chunk
	Size  coords.Vec3
	// Go is really slow at encoding arrays. This
	// is much faster (and more space efficient)
	Data  string
}

type MsgBlock struct {
	Pos  coords.World
	Type mapgen.Block
}

type MsgPlayerPosition struct {
	Pos       coords.World
	VelocityY float64
	// JavaScript performance.now() timestamp.
	Timestamp float64
}

type MsgControlsState struct {
	Controls  ControlState
	// JavaScript performance.now() timestamp.
	Timestamp float64
}

type MsgChat struct {
	DisplayName string
	Time        int64
	Message     string
}

type ClientMessage struct {
	Kind MessageKind
	Payload json.RawMessage
}

type Message interface{}
