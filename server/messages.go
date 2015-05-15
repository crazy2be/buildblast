package proto

import (
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
	"buildblast/lib/vmath"
	"buildblast/lib/proto"
)

type MessageId byte;

const (
	MSG_HANDSHAKE_REPLY = iota
	MSG_HANDSHAKE_ERROR
	MSG_ENTITY_CREATE
	MSG_ENTITY_STATE
	MSG_ENTITY_REMOVE
	MSG_CHUNK
	MSG_BLOCK
	MSG_CONTROLS_STATE
	MSG_CHAT
	MSG_DEBUG_RAY
	MSG_NTP_SYNC
	MSG_INVENTORY_STATE
	MSG_INVENTORY_MOVE
	MSG_SCOREBOARD_ADD
	MSG_SCOREBOARD_SET
	MSG_SCOREBOARD_REMOVE
)

func idToType(id MessageId) Message {
	switch id {
	case MSG_ENTITY_CREATE:
		return &MsgEntityCreate{}
	case MSG_ENTITY_STATE:
		return &MsgEntityState{}
	case MSG_ENTITY_REMOVE:
		return &MsgEntityRemove{}
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
	panic("Unknown message recieved from client: " + string(id))
}

func typeToId(m Message) MessageId {
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
	}
	panic("Attempted to send unknown message to client: " + reflect.TypeOf(m).String())
}

type MsgHandshakeReply struct {
	ServerTime       float64
	ClientID         string
	PlayerEntityInfo MsgEntityCreate
	Authenticated    bool
	AuthMessage      string
}

func (msg *MsgHandshakeReply) ToProto() []byte {
	buf := make([]byte, 256)
	buf = append(buf, proto.MarshalInt(MSG_HANDSHAKE_REPLY))
	buf = append(buf, proto.MarshalFloat64(msg.ServerTime))
	buf = append(buf, proto.MarshalString(msg.ClientID))
	buf = append(buf, msg.PlayerEntityInfo.ToProto()...)
	return buf
}

type MsgHandshakeError struct {
	Message string
}

func (msg *MsgHandshakeError) ToProto() []byte {
	buf := make([]byte, 256)
	buf = append(buf, MarshalInt(MSG_HANDSHAKE_ERROR))
	buf = append(buf, MarshalString(msg.Message))
	return buf;
}

type MsgEntityCreate struct {
	ID    game.EntityId
	Kind  game.EntityKind
	State interface{}
}

type MsgEntityState struct {
	ID    game.EntityId
	Kind  game.EntityKind
	State interface{}
}

type MsgEntityRemove struct {
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

type Message interface {
	Proto
}
