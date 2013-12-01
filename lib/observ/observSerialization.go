package observ

import (
	_ "fmt"
	"encoding/json"
)

//Not thread safe
type ObservSerialized struct {
    Data	Object
	Type	string
}

func (o *Observ) MarshalJSON() ([]byte, error) {
	return json.Marshal(&ObservSerialized{o.Get(), "Observable"})
}