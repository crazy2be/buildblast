package observable

import (
	_ "fmt"
)


//Not thread safe
type ObservableBase struct {
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
	
	setCallback			func(newData Object, oldValue Object)
}

func NewObservableBase(owner DisposeExposed, initialData Object) *ObservableBase {
	observ := new(ObservableBase)
	if owner == nil {
		panic("Owner cannot be nil")
	}
    observ.owner = owner
	observ.data = initialData
	
	observ.dataFutureCount = 0
	observ.maxDataFuture = 100
	observ.dataFuture = make([]Object, observ.maxDataFuture)
	return observ
}

//Eh... can't do it in the constructor as our parent embeds us, yet wants
//	to pass us a member function... so this will work
func (o *ObservableBase) SetCallback(setCallback func(newData Object, oldValue Object)) {
	o.setCallback = setCallback
}

func (o *ObservableBase) Set(value Object) {
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

func (o *ObservableBase) Get() Object {
	return o.data
}

func (o *ObservableBase) change(newValue Object) {
	prevValue := o.data
	o.data = newValue
	o.setCallback(o.data, prevValue)
}
