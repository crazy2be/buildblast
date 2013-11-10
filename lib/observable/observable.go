package observable

import (
	"fmt"
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
    owner               DisposeExposed
	data				Object
	//We sometimes need to buffer setting our data, as data may
	//	be set in a changed handler, and the other handlers will
	//	still want the original data that was set. They also
	//	want to be called in the order the data was set.
	dataFutureCount		int
	maxDataFuture		int
	dataFuture			[]Object
	
	dataChanging		bool
	
	curCallbackNum		int
	changedCallbacks	map[int]ObservCallback
}

func NewObservable(owner DisposeExposed, initialData Object) *Observable {
	observ := new(Observable)
	if owner == nil {
		panic("Owner cannot be nil")
	}
    observ.owner = owner
	observ.data = initialData
	
	observ.dataFutureCount = 0
	observ.maxDataFuture = 100
	observ.dataFuture = make([]Object, observ.maxDataFuture)
	
	observ.curCallbackNum = 0
	
	observ.changedCallbacks = make(map[int]ObservCallback, 0)
	return observ
}

func (o *Observable) Set(value Object) {
	if o.dataChanging {
		if o.dataFutureCount >= o.maxDataFuture {
			panic("Observable buffer size exceeded, your observables likely form an infinite loop")
		}
		o.dataFuture[o.dataFutureCount] = value
		o.dataFutureCount++
		return
	}
	
	o.dataChanging = true
	o.change(value)
	
	for o.dataFutureCount > 0 {
		value = o.dataFuture[0]
		
		o.dataFutureCount--
		for index := 0; index < o.dataFutureCount; index++ {
			o.dataFuture[index] = o.dataFuture[index + 1]
		}
		
		o.change(value)
	}
	o.dataChanging = false
}

func (o *Observable) Get() Object {
	return o.data
}

func (o *Observable) change(newValue Object) {
	prevValue := o.data
	o.data = newValue
	fmt.Println("Calling", len(o.changedCallbacks), "callbacks")
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
