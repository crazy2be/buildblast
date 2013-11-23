package observ

import (
	_ "fmt"
)

type ObservCallback func (data Object)

//Not thread safe
type Observ struct {
    *ObservBase
	
	data				Object
	
	curCallbackNum		int
	changedCallbacks	map[int]ObservCallback
}

func NewObserv(owner DisposeExposed, initialData Object) *Observ {
	o := &Observ{
		ObservBase: NewObservBase(owner), 
		data: initialData,
		curCallbackNum: 0,
	 	changedCallbacks: make(map[int]ObservCallback, 0),
	}
	
	o.SetCallback(func (data Object) {
		o.data = data
		for _, callback := range o.changedCallbacks {
			callback(data)
		}
	})
	
	return o
}

func (o *Observ) Set(data Object) {
	o.set(data)
}

func (o *Observ) Get() Object {
	return o.data
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observ) OnChanged(owner CallbackOwner, callback ObservCallback) int {
	if owner == nil {
		panic("Owner cannot be nil")
	}
	
	ourCallbackNum := o.curCallbackNum
	o.curCallbackNum++
	
    o.changedCallbacks[ourCallbackNum] = callback
	owner.OnDispose(func() {
		o.NotOnChanged(ourCallbackNum)
	})
	o.owner.OnDispose(func() {
		o.NotOnChanged(ourCallbackNum)
	})
    callback(o.data)
	
	return ourCallbackNum
}
func (o *Observ) NotOnChanged(callbackNum int) {
	delete(o.changedCallbacks, callbackNum)
}
