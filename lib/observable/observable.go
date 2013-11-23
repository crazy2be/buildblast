package observable

import (
	_ "fmt"
)

type IObservable interface {
	Set(value Object)
	Get() Object
	//Generally only used if you are watching your super (owner),
	//	as then you know it will outlast you (which is the only reason to use this,
	//	or if you absolutely cannot make it implement DisposeExposed).
	OnChanged(owner CallbackOwner, callback ObservCallback) int
	NotOnChanged(callbackNum int)
}

type ObservCallback func (data Object)

//Not thread safe
type Observable struct {
    *ObservableBase
	
	data				Object
	
	curCallbackNum		int
	changedCallbacks	map[int]ObservCallback
}

func NewObservable(owner DisposeExposed, initialData Object) *Observable {
	observ := &Observable{
		ObservableBase: NewObservableBase(owner), 
		data: initialData,
		curCallbackNum: 0,
	 	changedCallbacks: make(map[int]ObservCallback, 0),
	}
	
	observ.SetCallback(observ.ObservSet)
	
	return observ
}

func (o *Observable) ObservSet(data Object) {
	o.data = data
	for _, callback := range o.changedCallbacks {
		callback(data)
	}
}

func (o *Observable) Get() Object {
	return o.data
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observable) OnChanged(owner CallbackOwner, callback ObservCallback) int {
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
func (o *Observable) NotOnChanged(callbackNum int) {
	delete(o.changedCallbacks, callbackNum)
}
