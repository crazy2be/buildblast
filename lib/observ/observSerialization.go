package observ

import (
	_ "fmt"
)

//Not thread safe
type ObservSerialized struct {
    Data	Object
	Type	string
}

func (o *Observ) MakeSerializable() *ObservSerialized {
	return &ObservSerialized{o.Get(), "Observable"};
}
