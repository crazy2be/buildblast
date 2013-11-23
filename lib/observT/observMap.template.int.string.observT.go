package observT

import "buildblast/lib/observ"

type ObservMapCallback func (key int, value string)

//Not thread safe
type ObservMap_int_string struct {
	base *observ.ObservMap
}

func NewObservMap_int_string(owner observ.DisposeExposed) *ObservMap_int_string {
	return &ObservMap_int_string{observ.NewObservMap(owner)}
}

func (o *ObservMap_int_string) Set(key int, value string) {
	o.base.set(observ.KVP{key, value})
}

func (o *ObservMap_int_string) Delete(key int) {
	o.base.set(observ.KVP{key, nil})
}

func (o *ObservMap_int_string) GetKeys() []int {
    keys := []int{}
    for key, _ := range o.data {
        keys = append(keys, key)
    }
    return keys
}
func (o *ObservMap_int_string) GetValues() []string {
    values := []string{}
    for _, value := range o.data {
        values = append(values, value)
    }
    return values
}

func (o *ObservMap_int_string) Clear() {
    for key, _ := range o.data {
        o.Delete(key)
    }
}