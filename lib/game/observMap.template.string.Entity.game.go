package game

import "buildblast/lib/observ"

type ObservMapCallback_string_Entity func (key string, value Entity)

//Not thread safe
type ObservMap_string_Entity struct {
	base *observ.ObservMap
}

func NewObservMap_string_Entity(owner observ.DisposeExposed) *ObservMap_string_Entity {
	return &ObservMap_string_Entity{observ.NewObservMap(owner)}
}

func (o *ObservMap_string_Entity) Get(key string) Entity {
	return o.base.Get(key).(Entity)
}

func (o *ObservMap_string_Entity) Set(key string, value Entity) {
	o.base.Set(key, value)
}

func (o *ObservMap_string_Entity) Delete(key string) {
	o.base.Delete(key)
}

func (o *ObservMap_string_Entity) OnAdd(owner observ.CallbackOwner, callback ObservMapCallback_string_Entity) int {
	return o.base.OnAdd(owner, func(key observ.Object, value observ.Object) {
		callback(key.(string), value.(Entity))
	})
}
func (o *ObservMap_string_Entity) NotOnAdd(callbackNum int) {
	o.base.NotOnAdd(callbackNum)
}
func (o *ObservMap_string_Entity) OnRemove(owner observ.CallbackOwner, callback ObservMapCallback_string_Entity) int {
	return o.base.OnRemove(owner, func(key observ.Object, value observ.Object) {
		callback(key.(string), value.(Entity))
	})
}
func (o *ObservMap_string_Entity) NotOnRemove(callbackNum int) {
	o.base.NotOnAdd(callbackNum)
}

func (o *ObservMap_string_Entity) GetKeys() []string {
    keys := []string{}
    for _, key := range o.base.GetKeys() {
        keys = append(keys, key.(string))
    }
    return keys
}
func (o *ObservMap_string_Entity) GetValues() []Entity {
    values := []Entity{}
    for _, value := range o.base.GetValues() {
        values = append(values, value.(Entity))
    }
    return values
}

func (o *ObservMap_string_Entity) Clear() {
    o.base.Clear()
}