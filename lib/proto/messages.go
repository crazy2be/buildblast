package proto

import (
	"fmt"
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
)

type MessageId byte

var MESSAGES = []reflect.Type{
	reflect.TypeOf(&MsgHandshakeReply{}),   // CLIENT <--- SERVER
	reflect.TypeOf(&MsgHandshakeError{}),   // CLIENT <--- SERVER
	reflect.TypeOf(&MsgEntityCreate{}),     // CLIENT <--- SERVER
	reflect.TypeOf(&MsgEntityState{}),      // CLIENT <--- SERVER
	reflect.TypeOf(&MsgEntityRemove{}),     // CLIENT <--- SERVER
	reflect.TypeOf(&MsgChunk{}),            // CLIENT <--- SERVER
	reflect.TypeOf(&MsgBlock{}),            // CLIENT <--> SERVER
	reflect.TypeOf(&MsgControlsState{}),    // CLIENT ---> SERVER
	reflect.TypeOf(&MsgChatSend{}),         // CLIENT ---> SERVER
	reflect.TypeOf(&MsgChatBroadcast{}),    // CLIENT <--- SERVER
	reflect.TypeOf(&MsgDebugRay{}),         // CLIENT <--- SERVER
	reflect.TypeOf(&MsgNtpSyncRequest{}),   // CLIENT ---> SERVER
	reflect.TypeOf(&MsgNtpSyncReply{}),     // CLIENT <--- SERVER
	reflect.TypeOf(&MsgInventoryState{}),   // CLIENT <--- SERVER
	reflect.TypeOf(&MsgInventorySelect{}),  // CLIENT ---> SERVER
	reflect.TypeOf(&MsgInventoryMove{}),    // CLIENT ---> SERVER
	reflect.TypeOf(&MsgScoreboardAdd{}),    // CLIENT <--- SERVER
	reflect.TypeOf(&MsgScoreboardSet{}),    // CLIENT <--- SERVER
	reflect.TypeOf(&MsgScoreboardRemove{}), // CLIENT <--- SERVER
}

var MESSAGE_TO_ID map[reflect.Type]MessageId

func init() {
	MESSAGE_TO_ID = make(map[reflect.Type]MessageId)
	for i, value := range MESSAGES {
		MESSAGE_TO_ID[value] = MessageId(i)
	}
}

func idToMessage(id MessageId) Message {
	if int(id) >= len(MESSAGES) {
		panic(fmt.Sprintf("Unknown message recieved from client: %d", id))
	}
	return reflect.New(MESSAGES[id].Elem()).Interface()
}

func messageToId(m Message) MessageId {
	result, ok := MESSAGE_TO_ID[reflect.TypeOf(m)]
	if !ok {
		panic("Attempted to send unknown message to client: " + reflect.TypeOf(m).String())
	}
	return result
}

func typeIsMsg(m Message) bool {
	_, ok := MESSAGE_TO_ID[reflect.TypeOf(m)]
	return ok
}

type MsgHandshakeReply struct {
	ServerTime       float64
	ClientId         string
	PlayerEntityInfo MsgEntityCreate
	// DOIT: These are not used for some reason
	Authenticated bool
	AuthMessage   string
}

type MsgHandshakeError struct {
	Message string
}

type MsgEntityCreate struct {
	Id    game.EntityId
	Kind  game.EntityKind
	State interface{}
}

type MsgEntityState struct {
	Id    game.EntityId
	Kind  game.EntityKind
	State interface{}
}

type MsgEntityRemove struct {
	Id game.EntityId
}

type MsgChunk struct {
	Cpos   coords.Chunk
	Size   coords.Size
	Blocks []byte
}

type MsgBlock struct {
	Pos  coords.Block
	Type mapgen.Block
}

type MsgControlsState struct {
	Controls game.ControlState
}

type MsgChatSend struct {
	Message string
}

type MsgChatBroadcast struct {
	DisplayName string
	Message     string
}

type MsgDebugRay struct {
	Pos coords.World
}

type MsgNtpSyncRequest struct {
	// No fields
}

type MsgNtpSyncReply struct {
	ServerTime float64
}

type MsgInventoryState struct {
	Items []byte
}

type MsgInventorySelect struct {
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

type Message interface{}
