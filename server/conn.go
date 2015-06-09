package main

import (
	"fmt"
	"io"

	"buildblast/lib/proto"

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

func (c *Conn) Send(m proto.Message) error {
	data := proto.SerializeMessage(m)
	err := websocket.Message.Send(c.ws, data)
	if err != nil {
		return fmt.Errorf("Sending websocket binary data: %s", err)
	}
	return nil
}

func (c *Conn) Recv() (proto.Message, error) {
	var data []byte
	err := websocket.Message.Receive(c.ws, &data)
	if err != nil {
		if err == io.EOF {
			return nil, err
		}
		return nil, fmt.Errorf("Reading websocket binary data: %s", err)
	}
	return proto.DeserializeMessage(data)
}

func (c *Conn) Close() error {
	return c.ws.Close()
}
