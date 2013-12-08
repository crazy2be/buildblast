package conn

import (
	"encoding/json"
	"reflect"

    "buildblast/lib/coords"
	"buildblast/lib/geom"
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
	MSG_ENTITY_HP       = MessageKind("entity-hp")
	MSG_CHUNK           = MessageKind("chunk")
	MSG_BLOCK           = MessageKind("block")
	MSG_CONTROLS_STATE  = MessageKind("controls-state")
	MSG_CHAT            = MessageKind("chat")
	MSG_DEBUG_RAY       = MessageKind("debug-ray")
	MSG_NTP_SYNC        = MessageKind("ntp-sync")
	MSG_INVENTORY_STATE = MessageKind("inventory-state")
	MSG_INVENTORY_MOVE  = MessageKind("inventory-move")
    MSG_HILL_MOVE       = MessageKind("hill-move")
	MSG_HILL_COLOR_SET  = MessageKind("hill-color-set")
    MSG_HILL_POINTS_SET = MessageKind("hill-points-set")
	MSG_PROPERTY_SET 	= MessageKind("property-set")
	MSG_OBJ_PROP_SET	= MessageKind("obj-prop-set")
	//The message to end all messages
	MSG_KO_INTEGRATE	= MessageKind("ko-integrate")
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
    case MSG_HILL_MOVE:
        return &MsgHillMove{}
    case MSG_HILL_COLOR_SET:
        return &MsgHillColorSet{}
    case MSG_HILL_POINTS_SET:
        return &MsgHillPointsSet{}
	case MSG_PROPERTY_SET:
		return &MsgPropertySet{}
	case MSG_OBJ_PROP_SET:
		return &MsgObjPropSet{}
	case MSG_KO_INTEGRATE:
		return &MsgKoIntegrate{}
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
    case *MsgHillMove:
		return MSG_HILL_MOVE
	case *MsgHillColorSet:
		return MSG_HILL_COLOR_SET
    case *MsgHillPointsSet:
		return MSG_HILL_POINTS_SET
    case *MsgPropertySet:
		return MSG_PROPERTY_SET
	case *MsgObjPropSet:
		return MSG_OBJ_PROP_SET
	case *MsgKoIntegrate:
		return MSG_KO_INTEGRATE
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
	ID        string
	Pos       coords.World
	Look      coords.Direction
	Vy        float64
	Timestamp float64
}

type MsgEntityRemove struct {
	ID string
}

type MsgEntityHp struct {
	ID     string
	Health int
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

type MsgHillMove struct {
	Sphere     	geom.Sphere
}

type MsgHillColorSet struct {
	Color 		string
}

type MsgHillPointsSet struct {
	ID          string
    Points      int
}

//Hmm... eventually I should make a system so these are abstracted so they
//	can handle everything.
//Really entity property set
type MsgPropertySet struct {
	ID          string
    Name		string
	Value		interface{}
}

type MsgObjPropSet struct {
	ObjectName	string
    PropName	string
	Value		interface{}
}

//Basically all messages sent to the client should be in this format...
//	there is no need to make it handle messages specially, it can easily
//	decipher the intent based on the structure.
type MsgKoIntegrate struct {
	Name		string //Name should not contain the . symbol, as this is used to nest the Value
	Value		interface{}
}

type ClientMessage struct {
	Kind MessageKind
	// json.RawMessage implements Marshaler and Unmarshaler,
	// so it will NOT be serialized twice.
	Payload json.RawMessage
}

type Message interface{}