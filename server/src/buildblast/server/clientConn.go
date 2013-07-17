package main

import (
	"fmt"
	"time"
)

type ClientConn struct {
	name string

	Errors chan error

	sendQueue chan Message
	sendLossyQueue chan Message

	recvQueue chan Message
}

func NewClientConn(name string) *ClientConn {
	c := new(ClientConn)
	c.name = name

    //Temporary change to allow the client to send a lot of changes at once.
	c.sendQueue = make(chan Message, 1000)
	c.sendLossyQueue = make(chan Message, 5)

	c.recvQueue = make(chan Message, 100)

	c.Errors = make(chan error, 10)

	return c
}

func (c *ClientConn) Run(conn *Conn) {
	go c.runSend(conn)
	c.runRecv(conn)
}

func (c *ClientConn) runSend(conn *Conn) {
	for {
		var m Message
		select {
		case m = <-c.sendQueue:
		case m = <-c.sendLossyQueue:
		}

		err := conn.Send(m)
		if err != nil {
			c.Errors <- err
		}
	}
}

func (c *ClientConn) runRecv(conn *Conn) {
	for {
		m, err := conn.Recv()
		if err != nil {
			c.Errors <- err
			return
		}
		if mntp, ok := m.(*MsgNtpSync); ok {
			mntp.ServerTime = float64(time.Now().UnixNano() / 1e6)
			c.Send(mntp)
			continue
		}
		c.recvQueue <- m
	}
}

// Send will queue a message to be sent to a client. If there is
// an error transmitting the message, an error will be sent back
// on the Errors channel.
func (c *ClientConn) Send(m Message) {
	select {
	case c.sendQueue <- m:
	default:
		c.Errors <- fmt.Errorf("unable to send message %v to player %s", m, c.name)
	}
}

// SendLossy will try to queue a message to be sent to a client,
// but if it cannot, it will simply do nothing. The message's failure
// to send will not result in an error.
func (c *ClientConn) SendLossy(m Message) {
	if mep, ok := m.(*MsgEntityPosition); ok && mep.ID == c.name {
		return
	}
	select {
	case c.sendLossyQueue <- m:
	default:
	}
}
