package proto

import (
	"fmt"
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
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
	TOTAL_MESSAGES        = int(iota)
)

func idToMessage(id MessageId) Message {
	switch id {
	case MSG_HANDSHAKE_REPLY:
		return &MsgHandshakeReply{}
	case MSG_HANDSHAKE_ERROR:
		return &MsgHandshakeError{}
	case MSG_ENTITY_CREATE:
		return &MsgEntityCreate{}
	case MSG_ENTITY_STATE:
		return &MsgEntityState{}
	case MSG_ENTITY_REMOVE:
		return &MsgEntityRemove{}
	case MSG_CHUNK:
		return &MsgChunk{}
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
	panic(fmt.Sprintf("Unknown message recieved from client: %d, %s", id, reflect.TypeOf(id)))
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

func typeIsMsg(m Message) bool {
	switch m.(type) {
	case *MsgHandshakeReply,
		*MsgHandshakeError,
		*MsgEntityCreate,
		*MsgEntityState,
		*MsgEntityRemove,
		*MsgChunk,
		*MsgBlock,
		*MsgControlsState,
		*MsgChatSend,
		*MsgChatBroadcast,
		*MsgDebugRay,
		*MsgNtpSyncRequest,
		*MsgNtpSyncReply,
		*MsgInventoryState,
		*MsgInventorySelect,
		*MsgInventoryMove,
		*MsgScoreboardAdd,
		*MsgScoreboardSet,
		*MsgScoreboardRemove:
		return true
	default:
		return false
	}
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
	Cpos coords.Chunk
	Size coords.Size
	Data []byte
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
	Items     []byte
	ItemLeft  int
	ItemRight int
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
