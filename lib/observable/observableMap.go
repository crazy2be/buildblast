package observable

type ObservMapCallback func (key Object, value Object)

type KVP struct {
	Key 	Object
	Value 	Object
}

//Not thread safe
type ObservableMap struct {
    owner           DisposeExposed
	data			map[Object]Object
	
	//TODO: Put this into an embedded struct
	//We sometimes need to buffer setting our data, as data may
	//	be set in a changed handler, and the other handlers will
	//	still want the original data that was set. They also
	//	want to be called in the order the data was set.
	dataFutureCount		int
	maxDataFuture		int
	dataFuture			[]KVP
	
	dataChanging		bool
	
	curCallbackNum		int
	
	addCallbacks	map[int]ObservMapCallback
	removeCallbacks	map[int]ObservMapCallback
}

func NewObservableMap(owner DisposeExposed) *ObservableMap {
	observ := new(ObservableMap)
    observ.owner = owner
	observ.data = make(map[Object]Object)
	
	observ.dataFutureCount = 0
	observ.maxDataFuture = 100
	observ.dataFuture = make([]KVP, observ.maxDataFuture)
	
	observ.curCallbackNum = 0
	
	observ.addCallbacks = make(map[int]ObservMapCallback, 0)
	observ.removeCallbacks = make(map[int]ObservMapCallback, 0)
	return observ
}

func (o *ObservableMap) Set(key Object, value Object) {
	if o.dataChanging {
		if o.dataFutureCount >= o.maxDataFuture {
			panic("Observable buffer size exceeded, your observables likely form an infinite loop")
		}
		o.dataFuture[o.dataFutureCount] = KVP{key, value}
		o.dataFutureCount++
		return
	}
	
	o.dataChanging = true
	
	o.added(key, value)
	
	for o.dataFutureCount > 0 {
		kvp := o.dataFuture[0]
		
		o.dataFutureCount--
		for index := 0; index < o.dataFutureCount; index++ {
			o.dataFuture[index] = o.dataFuture[index + 1]
		}
		
		o.added(kvp.Key, kvp.Value)
	}
	o.dataChanging = false
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