package main

import (
	"fmt"
	"reflect"
	"time"

	"buildblast/lib/proto"
)

// ClientConn is a generic, non-blocking, lossy over lag
// wrapper around a Conn. It has queues for both sending
// and receiving messages, and will never block when you
// attempt to send a message, preferring instead to let you
// continue, and issue an error which you can deal with
// at your leisure.
type ClientConn struct {
	name string

	sendQueue      chan proto.Message
	sendLossyQueue chan proto.Message

	recvQueue chan proto.Message

	closeQueue chan bool

	errorQueue chan error
}

func NewClientConn(name string) *ClientConn {
	c := new(ClientConn)
	c.name = name

	c.sendQueue = make(chan proto.Message, 200)
	c.sendLossyQueue = make(chan proto.Message, 5)

	c.recvQueue = make(chan proto.Message, 100)

	c.closeQueue = make(chan bool, 1)

	c.errorQueue = make(chan error, 10)

	return c
}

// Start the client connection as a wrapper for the given
// connection. This is the only API function that blocks.
// Do not call this twice, strange things will happen.
func (c *ClientConn) Run(conn *Conn) {
	go c.runSend(conn)
	go c.runRecv(conn)
	c.runClose(conn)
}

func (c *ClientConn) runSend(conn *Conn) {
	for {
		var m proto.Message
		select {
		case m = <-c.sendQueue:
		case m = <-c.sendLossyQueue:
		}

		err := conn.Send(m)
		if err != nil {
			c.Error(err)
		}
	}
}

func (c *ClientConn) runRecv(conn *Conn) {
	for {
		m, err := conn.Recv()
		if err != nil {
			c.Error(err)
			return
		}
		if _, ok := m.(*proto.MsgNtpSyncRequest); ok {
			c.Send(&proto.MsgNtpSyncReply{
				ServerTime: float64(time.Now().UnixNano()) / 1e6,
			})
			continue
		}
		c.recvQueue <- m
	}
}

func (c *ClientConn) runClose(conn *Conn) {
	<-c.closeQueue
	conn.Close()
}

// Send will queue a message to be sent to a client. If there is
// an error transmitting the message, an error will be sent back
// on the Errors channel.
func (c *ClientConn) Send(m proto.Message) {
	select {
	case c.sendQueue <- m:
	default:
		c.Error(fmt.Errorf("unable to send message %v (%s) to player %s", m, reflect.TypeOf(m).String(), c.name))
	}
}

// SendLossy will try to queue a message to be sent to a client,
// but if it cannot, it will simply do nothing. The message's failure
// to send will not result in an error.
func (c *ClientConn) SendLossy(m proto.Message) {
	select {
	case c.sendLossyQueue <- m:
	default:
	}
}

// Close will queue the closure of this connection.
func (c *ClientConn) Close() {
	select {
	case c.closeQueue <- true:
	default:
		// It's already in the process of closing,
		// no need to send any more messages, so it's
		// safe to just drop it on the floor.
	}
}

// Trigger an error. Non-blocking (drops the error
// on the floor if it can't handle it immediately).
func (c *ClientConn) Error(err error) {
	select {
	case c.errorQueue <- err:
	default:
		// The errors channel is full. We could print
		// a log message or something, but it's likely to
		// just result in lots of useless output, since there's
		// already a whole queue of errors to be handled. So,
		// we just ignore it.
	}
}
