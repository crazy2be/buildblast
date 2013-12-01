package conn

import (
	"encoding/json"
	"fmt"
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

func (c *Conn) Send(m Message) error {
	var err error

	cm := new(ClientMessage)
	cm.Kind = typeToKind(m)

	//Payload(json.RawMessage) implements Marshaler and Unmarshaler,
	//so it will NOT be serialized twice.
	cm.Payload, err = json.Marshal(m)
	if err != nil {
		return fmt.Errorf("marshalling websocket message: %s", err)
	}

	err = websocket.JSON.Send(c.ws, cm)
	if err != nil {
		return fmt.Errorf("sending websocket message: %s", err)
	}

	return nil
}

func (c *Conn) Recv() (Message, error) {
	cm := new(ClientMessage)
	err := websocket.JSON.Receive(c.ws, cm)
	if err != nil {
		if err == io.EOF {
			return nil, err
		}
		return nil, fmt.Errorf("reading websocket message: %s", err)
	}

	m := kindToType(cm.Kind)
	err = json.Unmarshal(cm.Payload, &m)
	if err != nil {
		log.Println(cm.Payload)
		return nil, fmt.Errorf("unmarshalling websocket message of kind %s: %s (value: %s)", cm.Kind, err, string(cm.Payload))
	}

	return m, nil
}

func (c *Conn) Close() error {
	return c.ws.Close()
}
