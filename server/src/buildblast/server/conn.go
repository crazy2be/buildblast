package main

import (
	"io"
	"log"
	"fmt"
	"time"
	"reflect"
	"encoding/json"

	"code.google.com/p/go.net/websocket"
)

type Conn struct {
	ws *websocket.Conn
}

func NewConn(ws *websocket.Conn) *Conn {
	c := new(Conn)
	c.ws = ws
	return c
}

func (c *Conn) Send(m Message) error {
	var err error

	cm := new(ClientMessage)
	cm.Kind = typeToKind(m)

	cm.Payload, err = json.Marshal(m)
	if err != nil {
		return fmt.Errorf("marshalling websocket message: %s", err)
	}

	start := time.Now().UnixNano() / 1e6

	err = websocket.JSON.Send(c.ws, cm)
	if err != nil {
		return fmt.Errorf("sending websocket message: %s", err)
	}

	end := time.Now().UnixNano() / 1e6 - start
	if end > 10 {
		log.Println("That took", end, "ms to send")
	}

	return nil
}

func (c *Conn) Recv() (Message, error) {
	cm := new(ClientMessage)
	err := websocket.JSON.Receive(c.ws, cm)
	if err != nil {
		if err != io.EOF {
			log.Println("Reading websocket message:", err)
		}
		return nil, err
	}

	m := kindToType(cm.Kind)
	err = json.Unmarshal(cm.Payload, &m)
	if err != nil {
		log.Println("Unmarshalling websocket message:", err)
		return nil, err
	}

	return m, nil
}

func kindToType(kind MessageKind) Message {
	switch kind {
		case MSG_ENTITY_CREATE:
			return &MsgEntityCreate{}
		case MSG_ENTITY_POSITION:
			return &MsgEntityPosition{}
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
	}
	panic("Unknown message recieved from client: " + string(kind))
}

func typeToKind(m Message) MessageKind {
	switch m.(type) {
		case *MsgEntityCreate:
			return MSG_ENTITY_CREATE
		case *MsgEntityPosition:
			return MSG_ENTITY_POSITION
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
	}
	panic("Attempted to send unknown message to client: " + reflect.TypeOf(m).String())
}
