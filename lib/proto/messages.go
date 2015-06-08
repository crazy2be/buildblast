package proto

import (
	"fmt"
	"reflect"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
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

func typeIsMsg(m Message) bool {
	switch m.(type) {
	case *MsgHandshakeReply:
	case *MsgHandshakeError:
	case *MsgEntityCreate:
	case *MsgEntityState:
	case *MsgEntityRemove:
	case *MsgChunk:
	case *MsgBlock:
	case *MsgControlsState:
	case *MsgChatSend:
	case *MsgChatBroadcast:
	case *MsgDebugRay:
	case *MsgNtpSyncRequest:
	case *MsgNtpSyncReply:
	case *MsgInventoryState:
	case *MsgInventorySelect:
	case *MsgInventoryMove:
	case *MsgScoreboardAdd:
	case *MsgScoreboardSet:
	case *MsgScoreboardRemove:
	default:
		return false
	}
	return true;
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
	buf = append(buf, MarshalFloat64(msg.ServerTime)...)
	buf = append(buf, MarshalString(msg.ClientID)...)
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
	buf = append(buf, MarshalString(msg.Message)...)
	return buf
}

func (msg *MsgHandshakeError) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgHandshakeError")
}

type MsgEntityCreate struct {
	ID    game.EntityId
	Kind  game.EntityKind
	State Proto
}

func (msg *MsgEntityCreate) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_ENTITY_CREATE))
	buf = append(buf, MarshalString(string(msg.ID))...)
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
	State Proto
}

func (msg *MsgEntityState) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_ENTITY_STATE))
	buf = append(buf, MarshalString(string(msg.ID))...)
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
	buf = append(buf, MarshalString(string(msg.ID))...)
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
	msg.Message, read = UnmarshalString(buf[1:])
	return read + 1, nil
}

type MsgChatBroadcast struct {
	DisplayName string
	Message     string
}

func (msg *MsgChatBroadcast) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, byte(MSG_CHAT_BROADCAST))
	buf = append(buf, MarshalString(msg.DisplayName)...)
	buf = append(buf, MarshalString(msg.Message)...)
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
	buf = append(buf, MarshalFloat64(msg.ServerTime)...)
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
	buf = append(buf, MarshalInt(len(msg.Items))...)
	buf = append(buf, msg.Items...)
	buf = append(buf, MarshalInt(msg.ItemLeft)...)
	buf = append(buf, MarshalInt(msg.ItemRight)...)
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
	value, read = UnmarshalInt(buf[offset:])
	msg.ItemLeft = int(value)
	offset += read
	value, read = UnmarshalInt(buf[offset:])
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
	value, read = UnmarshalInt(buf[offset:])
	msg.From = int(value)
	offset += read
	value, read = UnmarshalInt(buf[offset:])
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
	buf = append(buf, MarshalString(msg.Name)...)
	buf = append(buf, MarshalInt(msg.Score)...)
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
	buf = append(buf, MarshalString(msg.Name)...)
	buf = append(buf, MarshalInt(msg.Score)...)
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
	buf = append(buf, MarshalString(msg.Name)...)
	return buf
}

func (msg *MsgScoreboardRemove) FromProto(buf []byte) (int, error) {
	panic("FromProto not implemented: MsgScoreboardRemove")
}

type Message interface {}

/*
func (d Direction) ToProto() []byte {
	vec3 := d.Vec3()
	return vec3.ToProto()
}

func (wc World) ToProto() []byte {
	vec3 := wc.Vec3()
	return vec3.ToProto()
}

func (bc Block) ToProto() []byte {
	buf := make([]byte, 0, 30)
	buf = append(buf, proto.MarshalInt(bc.X)...)
	buf = append(buf, proto.MarshalInt(bc.Y)...)
	buf = append(buf, proto.MarshalInt(bc.Z)...)
	return buf
}

func (bc *Block) FromProto(buf []byte) (int, error) {
	offset := 0
	var value int64
	var read int
	value, read = proto.UnmarshalInt(buf)
	bc.X = int(value)
	offset += read
	value, read = proto.UnmarshalInt(buf[offset:])
	bc.Y = int(value)
	offset += read
	value, read = proto.UnmarshalInt(buf[offset:])
	bc.Z = int(value)
	offset += read
	return offset, nil
}

func (cc Chunk) ToProto() []byte {
	buf := make([]byte, 0, 30)
	buf = append(buf, proto.MarshalInt(cc.X)...)
	buf = append(buf, proto.MarshalInt(cc.Y)...)
	buf = append(buf, proto.MarshalInt(cc.Z)...)
	return buf
}

func (oc Offset) ToProto() []byte {
	buf := make([]byte, 0, 30)
	buf = append(buf, proto.MarshalInt(oc.X)...)
	buf = append(buf, proto.MarshalInt(oc.Y)...)
	buf = append(buf, proto.MarshalInt(oc.Z)...)
	return buf
}

func (v *Vec3) ToProto() []byte {
	buf := make([]byte, 0, 3*8)
	buf = append(buf, proto.MarshalFloat64(v.X)...)
	buf = append(buf, proto.MarshalFloat64(v.Y)...)
	buf = append(buf, proto.MarshalFloat64(v.Z)...)
	return buf
}

func (v *Vec3) FromProto(buf []byte) (int, error) {
	if len(buf) < 3*8 {
		return 0, errors.New("Buffer too small: Vec3")
	}
	v.X, _ = proto.UnmarshalFloat64(buf[0:8])
	v.Y, _ = proto.UnmarshalFloat64(buf[8:16])
	v.Z, _ = proto.UnmarshalFloat64(buf[16:24])
	return 3 * 8, nil
}

func (es *EntityState) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, proto.MarshalString(string(es.EntityId))...)
	buf = append(buf, es.Body.ToProto()...)
	buf = append(buf, proto.MarshalFloat64(es.LastUpdated)...)
	return buf
}

func (es *EntityState) FromProto(buf []byte) (int, error) {
	var idString string
	var offset int
	idString, offset = proto.UnmarshalString(buf)
	es.EntityId = EntityId(idString)
	read, err := es.Body.FromProto(buf[offset:])
	offset += read
	if err != nil {
		return 0, err
	}
	es.LastUpdated, read = proto.UnmarshalFloat64(buf[offset:])
	offset += read
	return offset, nil
}

func (h *Health) ToProto() []byte {
	return proto.MarshalInt(h.Life)
}

func (h *Health) FromProto(buf []byte) (int, error) {
	life, read := proto.UnmarshalInt(buf)
	h.Life = int(life)
	return read, nil
}

func (bs *BioticState) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, bs.EntityState.ToProto()...)
	buf = append(buf, bs.Health.ToProto()...)
	return buf
}

func (bs *BioticState) FromProto(buf []byte) (int, error) {
	var offset int
	read, err := bs.EntityState.FromProto(buf)
	if err != nil {
		return 0, err
	}
	offset, err = bs.Health.FromProto(buf[read:])
	if err != nil {
		return 0, err
	}
	return read + offset, nil
}

func (cs *ControlState) ToProto() []byte {
	panic("ToProto not implemented: ControlState")
}

func (cs *ControlState) FromProto(buf []byte) (int, error) {
	value, read := proto.UnmarshalInt(buf)
	cs.controlFlags = int(value)
	cs.Lat, _ = proto.UnmarshalFloat64(buf[read+0*8 : read+1*8])
	cs.Lon, _ = proto.UnmarshalFloat64(buf[read+1*8 : read+2*8])
	cs.Timestamp, _ = proto.UnmarshalFloat64(buf[read+2*8 : read+3*8])
	cs.ViewTimestamp, _ = proto.UnmarshalFloat64(buf[read+3*8 : read+4*8])
	return read + 32, nil
}

func (b *Body) ToProto() []byte {
	buf := make([]byte, 0, 5*3*8)
	buf = append(buf, b.Pos.ToProto()...)
	buf = append(buf, b.Vel.ToProto()...)
	buf = append(buf, b.Dir.ToProto()...)
	buf = append(buf, b.HalfExtents.ToProto()...)
	buf = append(buf, b.CenterOffset.ToProto()...)
	return buf
}

func (b *Body) FromProto(buf []byte) (int, error) {
	if len(buf) < 5*3*8 {
		return 0, errors.New("Buffer too small: Body")
	}
	size := 3 * 8
	b.Pos.FromProto(buf[0*size:])
	b.Vel.FromProto(buf[1*size:])
	b.Dir.FromProto(buf[2*size:])
	b.HalfExtents.FromProto(buf[3*size:])
	b.CenterOffset.FromProto(buf[4*size:])
	return 5 * 3 * 8, nil
}

func (wis *WorldItemState) ToProto() []byte {
	buf := make([]byte, 0, 256)
	buf = append(buf, wis.EntityState.ToProto()...)
	buf = append(buf, byte(wis.ItemKind))
	return buf
}

func (wis *WorldItemState) FromProto(buf []byte) (int, error) {
	return 0, nil
}
 */
