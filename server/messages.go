package main

import (
	"fmt"
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
	"buildblast/lib/proto"
	"buildblast/lib/vmath"
)

type MessageId byte

const (
	MSG_HANDSHAKE_REPLY   = MessageId(iota) // CLIENT <--- SERVER
	MSG_HANDSHAKE_ERROR                     // CLIENT <--- SERVER
	MSG_ENTITY_CREATE                       // CLIENT <--- SERVER
	MSG_ENTITY_STATE                        // CLIENT <--- SERVER
	MSG_ENTITY_REMOVE                       // CLIENT <--- SERVER
	MSG_CHUNK                               // CLIENT <--- SERVER
	MSG_BLOCK                               // CLIENT <--> SERVER
	MSG_CONTROLS_STATE                      // CLIENT ---> SERVER
	MSG_CHAT_SEND                           // CLIENT ---> SERVER
	MSG_CHAT_BROADCAST                      // CLIENT <--- SERVER
	MSG_DEBUG_RAY                           // CLIENT <--- SERVER
	MSG_NTP_SYNC_REQUEST                    // CLIENT ---> SERVER
	MSG_NTP_SYNC_REPLY                      // CLIENT <--- SERVER
	MSG_INVENTORY_STATE                     // CLIENT <--- SERVER
	MSG_INVENTORY_SELECT                    // CLIENT ---> SERVER
	MSG_INVENTORY_MOVE                      // CLIENT ---> SERVER
	MSG_SCOREBOARD_ADD                      // CLIENT <--- SERVER
	MSG_SCOREBOARD_SET                      // CLIENT <--- SERVER
	MSG_SCOREBOARD_REMOVE                   // CLIENT <--- SERVER
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
	case MSG_CHAT_SEND:
		return &MsgChatSend{}
	case MSG_CHAT_BROADCAST:
		return &MsgChatBroadcast{}
	case MSG_DEBUG_RAY:
		return &MsgDebugRay{}
	case MSG_NTP_SYNC_REQUEST:
		return &MsgNtpSyncRequest{}
	case MSG_NTP_SYNC_REPLY:
		return &MsgNtpSyncReply{}
	case MSG_INVENTORY_STATE:
		return &MsgInventoryState{}
	case MSG_INVENTORY_SELECT:
		return &MsgInventorySelect{}
	case MSG_INVENTORY_MOVE:
		return &MsgInventoryMove{}
	case MSG_SCOREBOARD_ADD:
		return &MsgScoreboardAdd{}
	case MSG_SCOREBOARD_SET:
		return &MsgScoreboardSet{}
	case MSG_SCOREBOARD_REMOVE:
		return &MsgScoreboardRemove{}
	}
	panic(fmt.Sprintf("Unknown message recieved from client: %d", id))
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
	case *MsgChatSend:
		return MSG_CHAT_SEND
	case *MsgChatBroadcast:
		return MSG_CHAT_BROADCAST
	case *MsgDebugRay:
		return MSG_DEBUG_RAY
	case *MsgNtpSyncRequest:
		return MSG_NTP_SYNC_REQUEST
	case *MsgNtpSyncReply:
		return MSG_NTP_SYNC_REPLY
	case *MsgInventoryState:
		return MSG_INVENTORY_STATE
	case *MsgInventorySelect:
		return MSG_INVENTORY_SELECT
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
	buf = append(buf, byte(MSG_HANDSHAKE_REPLY))
	buf = append(buf, proto.MarshalFloat64(msg.ServerTime)...)
	buf = append(buf, proto.MarshalString(msg.ClientID)...)
	buf = append(buf, msg.PlayerEntityInfo.ToProto()...)
	return buf
}

func (msg *MsgHandshakeReply) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgHandshakeReply")
}

type MsgHandshakeError struct {
	Message string
}

func (msg *MsgHandshakeError) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_HANDSHAKE_ERROR))
	buf = append(buf, proto.MarshalString(msg.Message)...)
	return buf
}

func (msg *MsgHandshakeError) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgHandshakeError")
}

type MsgEntityCreate struct {
	ID    game.EntityId
	Kind  game.EntityKind
	State proto.Proto
}

func (msg *MsgEntityCreate) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_ENTITY_CREATE))
	buf = append(buf, proto.MarshalString(string(msg.ID))...)
	buf = append(buf, byte(msg.Kind))
	buf = append(buf, msg.State.ToProto()...)
	return buf
}

func (msg *MsgEntityCreate) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgEntityCreate")
}

type MsgEntityState struct {
	ID    game.EntityId
	Kind  game.EntityKind
	State proto.Proto
}

func (msg *MsgEntityState) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_ENTITY_STATE))
	buf = append(buf, proto.MarshalString(string(msg.ID))...)
	buf = append(buf, byte(msg.Kind))
	buf = append(buf, msg.State.ToProto()...)
	return buf
}

func (msg *MsgEntityState) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgEntityState")
}

type MsgEntityRemove struct {
	ID game.EntityId
}

func (msg *MsgEntityRemove) ToProto() []byte {
	buf := make([]byte, 0, 64)
	buf = append(buf, byte(MSG_ENTITY_REMOVE))
	buf = append(buf, proto.MarshalString(string(msg.ID))...)
	return buf
}

func (msg *MsgEntityRemove) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgEntityRemove")
}

type MsgChunk struct {
	CCPos coords.Chunk
	Size  vmath.Vec3
	Data  []byte
}

func (msg *MsgChunk) ToProto() []byte {
	buf := make([]byte, 0, 1+30+3*8+coords.BlocksPerChunk)
	buf = append(buf, byte(MSG_CHUNK))
	buf = append(buf, msg.CCPos.ToProto()...)
	buf = append(buf, msg.Size.ToProto()...)
	buf = append(buf, msg.Data...)
	return buf
}

func (msg *MsgChunk) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgEntityChunk")
}

type MsgBlock struct {
	Pos  coords.Block
	Type mapgen.Block
}

func (msg *MsgBlock) ToProto() []byte {
	buf := make([]byte, 0, 32)
	buf = append(buf, byte(MSG_BLOCK))
	buf = append(buf, msg.Pos.ToProto()...)
	buf = append(buf, byte(msg.Type))
	return buf
}

func (msg *MsgBlock) FromProto(buf []byte) (int, error) {
	read, _ := msg.Pos.FromProto(buf[1:])
	msg.Type = mapgen.Block(buf[read+1])
	return read + 1, nil
}

type MsgControlsState struct {
	Controls game.ControlState
}

func (msg *MsgControlsState) ToProto() []byte {
	panic("ToProto not implemented: MsgControlState")
}

func (msg *MsgControlsState) FromProto(buf []byte) (int, error) {
	read, err := msg.Controls.FromProto(buf[1:])
	return read + 1, err
}

type MsgChatSend struct {
	Message string
}

func (msg *MsgChatSend) ToProto() []byte {
	panic("ToProto not implemented: MsgChatSend")
}

func (msg *MsgChatSend) FromProto(buf []byte) (int, error) {
	var read int
	msg.Message, read = proto.UnmarshalString(buf[1:])
	return read + 1, nil
}

type MsgChatBroadcast struct {
	DisplayName string
	Message     string
}

func (msg *MsgChatBroadcast) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_CHAT_BROADCAST))
	buf = append(buf, proto.MarshalString(msg.DisplayName)...)
	buf = append(buf, proto.MarshalString(msg.Message)...)
	return buf
}

func (msg *MsgChatBroadcast) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgChatBroadcast")
}

type MsgDebugRay struct {
	Pos coords.World
}

func (msg *MsgDebugRay) ToProto() []byte {
	buf := make([]byte, 0, 31)
	buf = append(buf, byte(MSG_DEBUG_RAY))
	buf = append(buf, msg.Pos.ToProto()...)
	return buf
}

func (msg *MsgDebugRay) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgDebugRay")
}

type MsgNtpSyncRequest struct {
	// No fields
}

func (msg *MsgNtpSyncRequest) ToProto() []byte {
	panic("ToProto not implemented: MsgNtpSyncRequest")
}

func (msg *MsgNtpSyncRequest) FromProto(buf []byte) (int, error) {
	return 1, nil
}

type MsgNtpSyncReply struct {
	ServerTime float64
}

func (msg *MsgNtpSyncReply) ToProto() []byte {
	buf := make([]byte, 0, 3*8+1)
	buf = append(buf, byte(MSG_NTP_SYNC_REPLY))
	buf = append(buf, proto.MarshalFloat64(msg.ServerTime)...)
	return buf
}

func (msg *MsgNtpSyncReply) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgNtpSyncReply")
}

type MsgInventoryState struct {
	// This is a byte array encoded to a string, see ItemsToString() in items.go
	Items     []byte
	ItemLeft  int
	ItemRight int
}

func (msg *MsgInventoryState) ToProto() []byte {
	buf := make([]byte, 0, 1024)
	buf = append(buf, byte(MSG_INVENTORY_STATE))
	buf = append(buf, proto.MarshalInt(len(msg.Items))...)
	buf = append(buf, msg.Items...)
	buf = append(buf, proto.MarshalInt(msg.ItemLeft)...)
	buf = append(buf, proto.MarshalInt(msg.ItemRight)...)
	return buf
}

func (msg *MsgInventoryState) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgInventoryState")
}

type MsgInventorySelect struct {
	ItemLeft  int
	ItemRight int
}

func (msg *MsgInventorySelect) ToProto() []byte {
	panic("ToProto not implemented: MsgInventorySelect")
}

func (msg *MsgInventorySelect) FromProto(buf []byte) (int, error) {
	var value int64
	var read int
	offset := 1
	// Client doesn't send the item list
	value, read = proto.UnmarshalInt(buf[offset:])
	msg.ItemLeft = int(value)
	offset += read
	value, read = proto.UnmarshalInt(buf[offset:])
	msg.ItemRight = int(value)
	offset += read
	return read, nil
}

type MsgInventoryMove struct {
	From int
	To   int
}

func (msg *MsgInventoryMove) ToProto() []byte {
	panic("ToProto not implemented: MsgInventoryMove")
}

func (msg *MsgInventoryMove) FromProto(buf []byte) (int, error) {
	var value int64
	var read int
	offset := 1
	value, read = proto.UnmarshalInt(buf[offset:])
	msg.From = int(value)
	offset += read
	value, read = proto.UnmarshalInt(buf[offset:])
	msg.To = int(value)
	offset += read
	return read, nil
}

type MsgScoreboardAdd struct {
	Name  string
	Score int
}

func (msg *MsgScoreboardAdd) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_SCOREBOARD_ADD))
	buf = append(buf, proto.MarshalString(msg.Name)...)
	buf = append(buf, proto.MarshalInt(msg.Score)...)
	return buf
}

func (msg *MsgScoreboardAdd) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgScoreboardAdd")
}

type MsgScoreboardSet struct {
	Name  string
	Score int
}

func (msg *MsgScoreboardSet) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_SCOREBOARD_SET))
	buf = append(buf, proto.MarshalString(msg.Name)...)
	buf = append(buf, proto.MarshalInt(msg.Score)...)
	return buf
}

func (msg *MsgScoreboardSet) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgScoreboardSet")
}

type MsgScoreboardRemove struct {
	Name string
}

func (msg *MsgScoreboardRemove) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_SCOREBOARD_REMOVE))
	buf = append(buf, proto.MarshalString(msg.Name)...)
	return buf
}

func (msg *MsgScoreboardRemove) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgScoreboardRemove")
}

type Message interface {
	proto.Proto
}
