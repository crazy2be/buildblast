package main

import (
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
	"buildblast/lib/proto"
	"buildblast/lib/vmath"
)

type MessageId byte

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
	buf := make([]byte, 0, 256)
	buf = append(buf, MSG_HANDSHAKE_REPLY)
	buf = append(buf, proto.MarshalFloat64(msg.ServerTime)...)
	buf = append(buf, proto.MarshalString(msg.ClientID)...)
	buf = append(buf, msg.PlayerEntityInfo.ToProto()...)
	return buf
}

func (msg *MsgHandshakeReply) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgHandshakeError struct {
	Message string
}

func (msg *MsgHandshakeError) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, MSG_HANDSHAKE_ERROR)
	buf = append(buf, proto.MarshalString(msg.Message)...)
	return buf
}

func (msg *MsgHandshakeError) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgEntityCreate struct {
	ID    game.EntityId
	Kind  game.EntityKind
	State proto.Proto
}

func (msg *MsgEntityCreate) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, MSG_ENTITY_CREATE)
	buf = append(buf, proto.MarshalString(string(msg.ID))...)
	buf = append(buf, proto.MarshalString(string(msg.Kind))...)
	buf = append(buf, msg.State.ToProto()...)
	return buf
}

func (msg *MsgEntityCreate) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgEntityState struct {
	ID    game.EntityId
	Kind  game.EntityKind
	State proto.Proto
}

func (msg *MsgEntityState) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, MSG_ENTITY_STATE)
	buf = append(buf, proto.MarshalString(string(msg.ID))...)
	buf = append(buf, proto.MarshalString(string(msg.Kind))...)
	buf = append(buf, msg.State.ToProto()...)
	return buf
}

func (msg *MsgEntityState) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgEntityRemove struct {
	ID game.EntityId
}

func (msg *MsgEntityRemove) ToProto() []byte {
	buf := make([]byte, 0, 64)
	buf = append(buf, MSG_ENTITY_REMOVE)
	buf = append(buf, proto.MarshalString(string(msg.ID))...)
	return buf
}

func (msg *MsgEntityRemove) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgChunk struct {
	CCPos coords.Chunk
	Size  vmath.Vec3
	Data  []byte
}

func (msg *MsgChunk) ToProto() []byte {
	buf := make([]byte, 0, 1+3*30+3*8+32*32*32)
	buf = append(buf, MSG_CHUNK)
	buf = append(buf, msg.CCPos.ToProto()...)
	buf = append(buf, msg.Size.ToProto()...)
	buf = append(buf, msg.Data...)
	return buf
}

func (msg *MsgChunk) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgBlock struct {
	Pos  coords.Block
	Type mapgen.Block
}

func (msg *MsgBlock) ToProto() []byte {
	buf := make([]byte, 0, 32)
	buf = append(buf, MSG_BLOCK)
	buf = append(buf, msg.Pos.ToProto()...)
	buf = append(buf, byte(msg.Type))
	return buf
}

func (msg *MsgBlock) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgControlsState struct {
	Controls game.ControlState
}

func (msg *MsgControlsState) ToProto() []byte {
	buf := make([]byte, 0, 34)
	buf = append(buf, MSG_CONTROLS_STATE)
	buf = append(buf, msg.Controls.ToProto()...)
	return buf
}

func (msg *MsgControlsState) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgChat struct {
	DisplayName string
	Message     string
}

func (msg *MsgChat) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, MSG_CHAT)
	buf = append(buf, proto.MarshalString(msg.DisplayName)...)
	buf = append(buf, proto.MarshalString(msg.Message)...)
	return buf
}

func (msg *MsgChat) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgDebugRay struct {
	Pos coords.World
}

func (msg *MsgDebugRay) ToProto() []byte {
	buf := make([]byte, 0, 31)
	buf = append(buf, MSG_DEBUG_RAY)
	buf = append(buf, msg.Pos.ToProto()...)
	return buf
}

func (msg *MsgDebugRay) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgNtpSync struct {
	ServerTime float64
}

func (msg *MsgNtpSync) ToProto() []byte {
	buf := make([]byte, 0, 3*8+1)
	buf = append(buf, MSG_NTP_SYNC)
	buf = append(buf, proto.MarshalFloat64(msg.ServerTime)...)
	return buf
}

func (msg *MsgNtpSync) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgInventoryState struct {
	// This is a byte array encoded to a string, see ItemsToString() in items.go
	Items     string
	ItemLeft  int
	ItemRight int
}

func (msg *MsgInventoryState) ToProto() []byte {
	buf := make([]byte, 0, 1024)
	buf = append(buf, MSG_INVENTORY_STATE)
	buf = append(buf, proto.MarshalString(msg.Items)...)
	buf = append(buf, proto.MarshalInt(msg.ItemLeft)...)
	buf = append(buf, proto.MarshalInt(msg.ItemRight)...)
	return buf
}

func (msg *MsgInventoryState) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgInventoryMove struct {
	From int
	To   int
}

func (msg *MsgInventoryMove) ToProto() []byte {
	buf := make([]byte, 0, 21)
	buf = append(buf, MSG_INVENTORY_MOVE)
	buf = append(buf, proto.MarshalInt(msg.From)...)
	buf = append(buf, proto.MarshalInt(msg.To)...)
	return buf
}

func (msg *MsgInventoryMove) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgScoreboardAdd struct {
	Name  string
	Score int
}

func (msg *MsgScoreboardAdd) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, MSG_SCOREBOARD_ADD)
	buf = append(buf, proto.MarshalString(msg.Name)...)
	buf = append(buf, proto.MarshalInt(msg.Score)...)
	return buf
}

func (msg *MsgScoreboardAdd) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgScoreboardSet struct {
	Name  string
	Score int
}

func (msg *MsgScoreboardSet) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, MSG_SCOREBOARD_SET)
	buf = append(buf, proto.MarshalString(msg.Name)...)
	buf = append(buf, proto.MarshalInt(msg.Score)...)
	return buf
}

func (msg *MsgScoreboardSet) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type MsgScoreboardRemove struct {
	Name string
}

func (msg *MsgScoreboardRemove) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, MSG_SCOREBOARD_REMOVE)
	buf = append(buf, proto.MarshalString(msg.Name)...)
	return buf
}

func (msg *MsgScoreboardRemove) FromProto(buf []byte) (int, error) {
	return len(buf), nil
}

type Message interface {
	proto.Proto
}
