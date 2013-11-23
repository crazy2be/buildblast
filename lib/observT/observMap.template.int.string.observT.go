package observT

import "buildblast/lib/observ"

type ObservMapCallback_int_string func (key int, value string)

//Not thread safe
type ObservMap_int_string struct {
	base *observ.ObservMap
}

func NewObservMap_int_string(owner observ.DisposeExposed) *ObservMap_int_string {
	return &ObservMap_int_string{observ.NewObservMap(owner)}
}

func (o *ObservMap_int_string) Get(key int) string {
	return o.base.Get(key).(string)
}

func (o *ObservMap_int_string) Set(key int, value string) {
	o.base.Set(key, value)
}

func (o *ObservMap_int_string) Delete(key int) {
	o.base.Delete(key)
}

func (o *ObservMap_int_string) OnAdd(owner observ.CallbackOwner, callback ObservMapCallback_int_string) int {
	return o.base.OnAdd(owner, func(key observ.Object, value observ.Object) {
		callback(key.(int), value.(string))
	})
}
func (o *ObservMap_int_string) NotOnAdd(callbackNum int) {
	o.base.NotOnAdd(callbackNum)
}
func (o *ObservMap_int_string) OnRemove(owner observ.CallbackOwner, callback ObservMapCallback_int_string) int {
	return o.base.OnRemove(owner, func(key observ.Object, value observ.Object) {
		callback(key.(int), value.(string))
	})
}
func (o *ObservMap_int_string) NotOnRemove(callbackNum int) {
	o.base.NotOnAdd(callbackNum)
}

func (o *ObservMap_int_string) GetKeys() []int {
    keys := []int{}
    for _, key := range o.base.GetKeys() {
        keys = append(keys, key.(int))
    }
    return keys
}
func (o *ObservMap_int_string) GetValues() []string {
    values := []string{}
    for _, value := range o.base.GetValues() {
        values = append(values, value.(string))
    }
    return values
}

func (o *ObservMap_int_string) Clear() {
    o.base.Clear()
}