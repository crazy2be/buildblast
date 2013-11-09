package observable

type ObservMapCallback func (key Object, value Object)

//Not thread safe
type ObservableMap struct {
    owner           DisposeExposed
	data			map[Object]Object
	addCallbacks	map[CallbackOwner]ObservMapCallback
	removeCallbacks	map[CallbackOwner]ObservMapCallback
}

func NewObservableMap(owner DisposeExposed) *ObservableMap {
	observ := new(ObservableMap)
    observ.owner = owner
	observ.data = make(map[Object]Object)
	observ.addCallbacks = make(map[CallbackOwner]ObservMapCallback, 0)
	observ.removeCallbacks = make(map[CallbackOwner]ObservMapCallback, 0)
	return observ
}

func (o *ObservableMap) Set(key Object, value Object) Object{
	prevValue := o.data[key]
	o.data[key] = value

	if prevValue != nil {
		o.removed(key, prevValue)
	}
	o.added(key, value)

	return prevValue
}
func (o *ObservableMap) Delete(key Object) Object {
	prevValue := o.data[key]
	delete(o.data, key)
	o.removed(key, prevValue)
	return prevValue
}
func (o *ObservableMap) Get(key Object) Object {
    val, ok := o.data[key]
    if !ok {
        return nil
    }
	return val
}
func (o *ObservableMap) GetKeys() []Object {
    keys := []Object{}
    for key, _ := range o.data {
        keys = append(keys, key)
    }
    return keys
}
func (o *ObservableMap) GetValues() []Object {
    values := []Object{}
    for _, value := range o.data {
        values = append(values, value)
    }
    return values
}

func (o *ObservableMap) Clear() {
    for key, _ := range o.data {
        o.Delete(key)
    }
}

func (o *ObservableMap) added(key Object, value Object) {
	for _, callback := range o.addCallbacks {
		callback(key, value)
	}
}
func (o *ObservableMap) removed(key Object, value Object) {
	for _, callback := range o.removeCallbacks {
		callback(key, value)
	}
}

func (o *ObservableMap) OnAdd(owner CallbackOwner, callback ObservMapCallback) {
	o.addCallbacks[owner] = callback
	owner.OnDispose(func() {
		o.NotOnAdd(owner)
	})
    if o.owner != nil {
	    o.owner.OnDispose(func() {
		    o.NotOnAdd(owner)
	    })
    }
	for key, value := range o.data {
		callback(key, value)
	}
}
func (o *ObservableMap) NotOnAdd(owner CallbackOwner) {
	delete(o.addCallbacks, owner)
}

func (o *ObservableMap) OnRemove(owner CallbackOwner, callback ObservMapCallback) {
    o.removeCallbacks[owner] = callback
	owner.OnDispose(func() {
		o.NotOnRemove(owner)
	})
    if o.owner != nil {
	    o.owner.OnDispose(func() {
		    o.NotOnRemove(owner)
	    })
    }
}
func (o *ObservableMap) NotOnRemove(owner CallbackOwner) {
	delete(o.removeCallbacks, owner)
}