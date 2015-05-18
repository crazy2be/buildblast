package main

import (
	"fmt"
	"io"

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
	data := m.ToProto()
	err := websocket.Message.Send(c.ws, data)
	if err != nil {
		return fmt.Errorf("Sending websocket binary data: %s", err)
	}
	return nil
}

func (c *Conn) Recv() (Message, error) {
	// DOIT: Proto testing
	//	var data []byte
	//	websocket.Message.Receive(c.ws, &data)
	//	value, _ := proto.UnmarshalString(data[1:])
	//	fmt.Printf("Got stuff: %s\n", value)
	//	data = make([]byte, 1)
	//	data[0] = 0
	//	data = append(data, proto.MarshalString(value)...)
	//	websocket.Message.Send(c.ws, data)
	//	return nil, nil
	var data []byte
	err := websocket.Message.Receive(c.ws, &data)
	if err != nil {
		if err == io.EOF {
			return nil, err
		}
		return nil, fmt.Errorf("Reading websocket binary data: %s", err)
	}
	m := idToType(MessageId(data[0]))
	_, err = m.FromProto(data)
	return m, err
}

func (c *Conn) Close() error {
	return c.ws.Close()
}
