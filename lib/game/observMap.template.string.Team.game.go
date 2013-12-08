package game

import "buildblast/lib/observ"

type ObservMapCallback_string_Team func (key string, value Team)

//Not thread safe
type ObservMap_string_Team struct {
	base *observ.ObservMap
}

func NewObservMap_string_Team(owner observ.DisposeExposed) *ObservMap_string_Team {
	return &ObservMap_string_Team{observ.NewObservMap(owner)}
}

func (o *ObservMap_string_Team) Get(key string) Team {
	return o.base.Get(key).(Team)
}

func (o *ObservMap_string_Team) Set(key string, value Team) {
	o.base.Set(key, value)
}

func (o *ObservMap_string_Team) Delete(key string) {
	o.base.Delete(key)
}

func (o *ObservMap_string_Team) OnAdd(owner observ.CallbackOwner, callback ObservMapCallback_string_Team) int {
	return o.base.OnAdd(owner, func(key observ.Object, value observ.Object) {
		callback(key.(string), value.(Team))
	})
}
func (o *ObservMap_string_Team) OffAdd(callbackNum int) {
	o.base.OffAdd(callbackNum)
}

func (o *ObservMap_string_Team) OnRemove(owner observ.CallbackOwner, callback ObservMapCallback_string_Team) int {
	return o.base.OnRemove(owner, func(key observ.Object, value observ.Object) {
		callback(key.(string), value.(Team))
	})
}
func (o *ObservMap_string_Team) OffRemove(callbackNum int) {
	o.base.OffRemove(callbackNum)
}

func (o *ObservMap_string_Team) OnChange(owner observ.CallbackOwner, callback ObservMapCallback_string_Team) int {
	return o.base.OnChange(owner, func(key observ.Object, value observ.Object) {
		callback(key.(string), value.(Team))
	})
}
func (o *ObservMap_string_Team) OffChange(callbackNum int) {
	o.base.OffChange(callbackNum)
}

func (o *ObservMap_string_Team) GetKeys() []string {
    keys := []string{}
    for _, key := range o.base.GetKeys() {
        keys = append(keys, key.(string))
    }
    return keys
}
func (o *ObservMap_string_Team) GetValues() []Team {
    values := []Team{}
    for _, value := range o.base.GetValues() {
        values = append(values, value.(Team))
    }
    return values
}

func (o *ObservMap_string_Team) Clear() {
    o.base.Clear()
}

func (o *ObservMap_string_Team) MarshalJSON() ([]byte, error) {
	return o.base.MarshalJSON();
}

func (o *ObservMap_string_Team) GetMapBase() *observ.ObservMap {
	return o.base
}