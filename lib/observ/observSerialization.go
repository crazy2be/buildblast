package observ

import (
	"fmt"
	"encoding/json"
)

type ObservSerialized struct {
    Data	Object
	Type	string
}

func (o *Observ) MarshalJSON() ([]byte, error) {
	return json.Marshal(&ObservSerialized{o.Get(), "Observable"})
}

//Not thread safe
type ObservMapSerialized struct {
    KVPs	map[string]Object
	Type	string
}

func (o *ObservMap) MarshalJSON() ([]byte, error) {
	strMap := make(map[string]Object)
	
	for key, value := range o.data {
		keyStr := fmt.Sprintf("%s", key)
		val, ok := strMap[keyStr]
		if ok {
			fmt.Println("Colliding key when serializing", o, "(key:", keyStr, ", val1: ", val, ", val2:", value, ").")
			fmt.Println("\t(You should implement a String() string function that does not collide.)")
		}
		strMap[keyStr] = value
	}
	
	return json.Marshal(&ObservMapSerialized{strMap, "ObservableMap"})
}