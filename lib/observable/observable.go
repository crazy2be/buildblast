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

type ObservCallback func (newValue Object, oldValue Object)

//Not thread safe
type Observable struct {
    *ObservableBase
	
	curCallbackNum		int
	changedCallbacks	map[int]ObservCallback
}

func NewObservable(owner DisposeExposed, initialData Object) *Observable {
	observ := &Observable{
		NewObservableBase(owner, initialData), 
		0,
	 	make(map[int]ObservCallback, 0),
	}
	
	observ.SetCallback(observ.ObservSet)
	
	return observ
}

func (o *Observable) ObservSet(newValue Object, prevValue Object) {
	for _, callback := range o.changedCallbacks {
		callback(newValue, prevValue)
	}
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
    callback(o.data, nil)
	
	return ourCallbackNum
}
func (o *Observable) NotOnChanged(callbackNum int) {
	delete(o.changedCallbacks, callbackNum)
}
