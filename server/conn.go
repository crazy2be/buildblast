package main

import (
	"io"
	"log"
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

func (c *Conn) Send(m Message) {
	var err error

	cm := new(ClientMessage)
	cm.Kind = typeToKind(m)
	cm.Payload, err = json.Marshal(m)
	if err != nil {
		log.Print("Marshalling websocket message: ", err)
	}
	err = websocket.JSON.Send(c.ws, cm)
	if err != nil {
		log.Print("Sending websocket message: ", err)
		return
	}
}

func (c *Conn) Recv() Message {
	cm := new(ClientMessage)
	err := websocket.JSON.Receive(c.ws, cm)
	if err != nil {
		if err != io.EOF {
			log.Print("Reading websocket message: ", err)
		}
		return nil
	}
	m := kindToType(cm.Kind)
	err = json.Unmarshal(cm.Payload, &m)
	if err != nil {
		log.Println("Unmarshalling websocket message: ", err)
	}
	return m
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
		case MSG_PLAYER_POSITION:
			return &MsgPlayerPosition{}
	}
	panic("Unknown message recieved from client!")
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
		case *MsgPlayerPosition:
			return MSG_PLAYER_POSITION
	}
	panic("Attempted to send unknown message to client!" + reflect.TypeOf(m).String())
}
