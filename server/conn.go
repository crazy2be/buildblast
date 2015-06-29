package main

import (
	"fmt"
	"io"

	"github.com/gorilla/websocket"

	"buildblast/server/lib/proto"
)

type Conn struct {
	ws *websocket.Conn
}

func NewConn(ws *websocket.Conn) *Conn {
	c := new(Conn)
	c.ws = ws
	return c
}

func (c *Conn) Send(m proto.Message) error {
	data := proto.SerializeMessage(m)
	err := c.ws.WriteMessage(websocket.BinaryMessage, data)
	if err != nil {
		return fmt.Errorf("Coudn't write data to websocket: %v", err)
	}
	return nil
}

func (c *Conn) Recv() (proto.Message, error) {
	_, data, err := c.ws.ReadMessage()
	if err != nil {
		if err == io.EOF {
			return nil, err
		}
		return nil, fmt.Errorf("Reading websocket binary data: %v", err)
	}
	return proto.DeserializeMessage(data), err
}

func (c *Conn) Close() error {
	return c.ws.Close()
}
