package observable

type ObservMapCallback func (key Object, value Object)

type KVP struct {
	Key 	Object
	Value 	Object
}

//Not thread safe
type ObservableMap struct {
	*ObservableBase
	
	data				map[Object]Object
	
	curCallbackNum		int
	
	addCallbacks		map[int]ObservMapCallback
	removeCallbacks		map[int]ObservMapCallback
}

func NewObservableMap(owner DisposeExposed) *ObservableMap {
	o := &ObservableMap{
		ObservableBase: NewObservableBase(owner),
		data: make(map[Object]Object),
		curCallbackNum: 0,
		addCallbacks: make(map[int]ObservMapCallback, 0),
		removeCallbacks: make(map[int]ObservMapCallback, 0),
	}
	
	o.SetCallback(func (kvpObj Object) {
		kvp := kvpObj.(KVP);
		if kvp.Value == nil {
			prevValue := o.Get(kvp.Key)
			delete(o.data, kvp.Key)
			o.removed(kvp.Key, prevValue)
		} else {
			o.added(kvp.Key, kvp.Value)
		}
	})
	
	return o
}

func (o *ObservableMap) Get(key Object) Object {
    val, ok := o.data[key]
    if !ok {
        return nil
    }
	return val
}

func (o *ObservableMap) added(key Object, value Object) {
	o.data[key] = value
	for _, callback := range o.addCallbacks {
		callback(key, value)
	}
}
func (o *ObservableMap) removed(key Object, value Object) {
	for _, callback := range o.removeCallbacks {
		callback(key, value)
	}
}

func (o *ObservableMap) OnAdd(owner CallbackOwner, callback ObservMapCallback) int {
	ourCallbackNum := o.curCallbackNum
	o.curCallbackNum++
	
	o.addCallbacks[ourCallbackNum] = callback
	
	owner.OnDispose(func() {
		o.NotOnAdd(ourCallbackNum)
	})
    if o.owner != nil {
	    o.owner.OnDispose(func() {
		    o.NotOnAdd(ourCallbackNum)
	    })
    }
	for key, value := range o.data {
		callback(key, value)
	}
	return ourCallbackNum
}
func (o *ObservableMap) NotOnAdd(callbackNum int) {
	delete(o.addCallbacks, callbackNum)
}

func (o *ObservableMap) OnRemove(owner CallbackOwner, callback ObservMapCallback) int {	
	ourCallbackNum := o.curCallbackNum
	o.curCallbackNum++
	
    o.removeCallbacks[ourCallbackNum] = callback
	
	owner.OnDispose(func() {
		o.NotOnRemove(ourCallbackNum)
	})
    if o.owner != nil {
	    o.owner.OnDispose(func() {
		    o.NotOnRemove(ourCallbackNum)
	    })
    }
	
	return ourCallbackNum
}
func (o *ObservableMap) NotOnRemove(callbackNum int) {
	delete(o.removeCallbacks, callbackNum)
}