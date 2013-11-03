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
	OnChanged(owner CallbackOwner, callback ObservCallback)
	NotOnChanged(owner CallbackOwner)
}

type ObservCallback func (newValue Object, oldValue Object)

//Not thread safe
type Observable struct {
    owner               DisposeExposed
	data				Object
	changedCallbacks	map[CallbackOwner]ObservCallback
}

func NewObservable(owner DisposeExposed, initialData Object) *Observable {
	observ := new(Observable)
    observ.owner = owner;
	observ.data = initialData
	observ.changedCallbacks = make(map[CallbackOwner]ObservCallback, 0)
	return observ
}

func (o *Observable) Set(value Object) Object {
	prevValue := o.data
	o.data = value

	o.changed(prevValue)

	return prevValue
}

func (o *Observable) Get() Object {
	return o.data
}

func (o *Observable) changed(prevValue Object) {
	for _, callback := range o.changedCallbacks {
		callback(o.data, prevValue)
	}
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observable) OnChanged(owner CallbackOwner, callback ObservCallback) {
    o.changedCallbacks[owner] = callback
	owner.OnDispose(func() {
		o.NotOnChanged(owner)
	})
    if o.owner != nil {
	    o.owner.OnDispose(func() {
		    o.NotOnChanged(owner)
	    })
    }
    callback(o.data, nil)
}
func (o *Observable) NotOnChanged(owner CallbackOwner) {
	delete(o.changedCallbacks, owner)
}