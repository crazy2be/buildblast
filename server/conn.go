package main

import (
	"io"
	"log"
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

func (c *Conn) Send(m *Message) {
	err := websocket.JSON.Send(c.ws, m)
	if err != nil {
		log.Print("Sending websocket message: ", err)
		return
	}
}

func (c *Conn) Recv() *Message {
	m := new(Message)
	err := websocket.JSON.Receive(c.ws, m)
	if err != nil {
		if err != io.EOF {
			log.Print("Reading websocket message: ", err)
		}
		return nil
	}
	return m
}
