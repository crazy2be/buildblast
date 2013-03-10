package main

import (
	"fmt"
)

type Message struct {
	Kind string
	Payload map[string]interface{}
}

func NewMessage(kind string) *Message {
	ms := new(Message)
	ms.Kind = kind
	ms.Payload = make(map[string]interface{})
	return ms
}

func (m *Message) String() string {
	return fmt.Sprintf("{kind: %s, payload: %v}", m.Kind, m.Payload)
}
