package main

import (
	"fmt"
//	"io"
	"log"

	"code.google.com/p/go.net/websocket"
	"buildblast/lib/proto"
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
	var data []byte
	err := websocket.Message.Receive(c.ws, &data)
	if err != nil {
		return nil, fmt.Errorf("WHAT?");
	}
	if data[0] == 0 {
		num, read := proto.UnmarshalInt(data[1:])
		log.Println("Result:", num, "Read:", read)
		buf := make([]byte, 0, 11)
		buf = append(buf, 1)
		buf = append(buf, proto.MarshalInt(123456789)...)
		log.Println("HI:", buf)
		websocket.Message.Send(c.ws, buf)
	}
//	err := websocket.Message.Receive(c.ws, &data)
//	if err != nil {
//		if err == io.EOF {
//			return nil, err
//		}
//		return nil, fmt.Errorf("Reading websocket binary data: %s", err)
//	}
//	m := idToType(MessageId(data[0]))
//	_, err = m.FromProto(data)
//	return m, err
	return nil, nil
}

func (c *Conn) Close() error {
	return c.ws.Close()
}
