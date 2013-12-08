package observ

type ObservMapCallback func (key Object, value Object)

type KVP struct {
	Key 	Object
	Value 	Object
}

//Not thread safe
type ObservMap struct {
	*ObservBase
	
	data				map[Object]Object
	
	curCallbackNum		int
	
	addCallbacks		map[int]ObservMapCallback
	removeCallbacks		map[int]ObservMapCallback
	changeCallbacks		map[int]ObservMapCallback
}

func NewObservMap(owner DisposeExposed) *ObservMap {
	o := &ObservMap{
		ObservBase: NewObservBase(owner),
		data: make(map[Object]Object),
		curCallbackNum: 0,
		addCallbacks: make(map[int]ObservMapCallback, 0),
		removeCallbacks: make(map[int]ObservMapCallback, 0),
		changeCallbacks: make(map[int]ObservMapCallback, 0),
	}
	
	o.SetCallback(func (kvpObj Object) {
		kvp := kvpObj.(KVP);
		prevValue := o.Get(kvp.Key)
		if kvp.Value == nil {
			delete(o.data, kvp.Key)
			o.removed(kvp.Key, prevValue)
			return
		} else {
			if prevValue == nil {
				o.added(kvp.Key, kvp.Value)
			}
			o.changed(kvp.Key, kvp.Value)
		}
	})
	
	return o
}

func (o *ObservMap) Get(key Object) Object {
    val, ok := o.data[key]
    if !ok {
        return nil
    }
	return val
}

func (o *ObservMap) added(key Object, value Object) {
	o.data[key] = value
	for _, callback := range o.addCallbacks {
		callback(key, value)
	}
}
func (o *ObservMap) removed(key Object, value Object) {
	for _, callback := range o.removeCallbacks {
		callback(key, value)
	}
}
func (o *ObservMap) changed(key Object, value Object) {
	for _, callback := range o.changeCallbacks {
		callback(key, value)
	}
}

func (o *ObservMap) addACallback(owner CallbackOwner, callback ObservMapCallback, callbacks map[int]ObservMapCallback, offCallback func(callbackNum int)) int {
	ourCallbackNum := o.curCallbackNum
	o.curCallbackNum++
	
	callbacks[ourCallbackNum] = callback
	
	owner.OnDispose(func() {
		offCallback(ourCallbackNum)
	})
    if o.owner != nil {
	    o.owner.OnDispose(func() {
		    offCallback(ourCallbackNum)
	    })
    }
	
	return ourCallbackNum
}

func (o *ObservMap) OnAdd(owner CallbackOwner, callback ObservMapCallback) int {
	ourCallbackNum := o.addACallback(owner, callback, o.addCallbacks, o.OffAdd);
	
	for key, value := range o.data {
		callback(key, value)
	}
	return ourCallbackNum
}
func (o *ObservMap) OffAdd(callbackNum int) {
	delete(o.addCallbacks, callbackNum)
}

func (o *ObservMap) OnRemove(owner CallbackOwner, callback ObservMapCallback) int {	
	return o.addACallback(owner, callback, o.removeCallbacks, o.OffRemove)
}
func (o *ObservMap) OffRemove(callbackNum int) {
	delete(o.removeCallbacks, callbackNum)
}

func (o *ObservMap) OnChange(owner CallbackOwner, callback ObservMapCallback) int {
	ourCallbackNum := o.addACallback(owner, callback, o.changeCallbacks, o.OffChange);
	
	for key, value := range o.data {
		callback(key, value)
	}
	return ourCallbackNum
}
func (o *ObservMap) OffChange(callbackNum int) {
	delete(o.changeCallbacks, callbackNum)
}