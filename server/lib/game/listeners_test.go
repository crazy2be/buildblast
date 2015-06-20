package game

import (
	"testing"
)

type myType struct {
	timesCalled int
}

func (m *myType) FooHappened() {
	m.timesCalled++
}

func TestGenericListenerContainer(t *testing.T) {
	m := &myType{}
	glc := makeGenericListenerContainer()
	glc.Add(m)
	glc.FireEvent("FooHappened")
	if m.timesCalled != 1 {
		t.Error("Registered callback not called!")
	}
	// Should NOT panic!
	glc.FireEvent("Some garbage")
	if m.timesCalled != 1 {
		t.Error("Registered callback called when it shouldn't have been.")
	}
	glc.Remove(m)
	glc.FireEvent("FooHappened")
	if m.timesCalled != 1 {
		t.Error("Registered callback still called after removal!")
	}
}
