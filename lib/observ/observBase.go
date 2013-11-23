package observ

import (
	_ "fmt"
)


//Not thread safe
type ObservBase struct {
    owner               DisposeExposed
	
	//We sometimes need to buffer setting our data, as data may
	//	be set in a changed handler, and the other handlers will
	//	still want the original data that was set. They also
	//	want to be called in the order the data was set.
	dataFutureCount		int
	maxDataFuture		int
	dataFuture			[]Object
	
	dataChanging		bool
	
	setCallback			func(data Object)
}

func NewObservBase(owner DisposeExposed) *ObservBase {
	observ := new(ObservBase)
	if owner == nil {
		panic("Owner cannot be nil")
	}
    observ.owner = owner
	
	observ.dataFutureCount = 0
	observ.maxDataFuture = 100
	observ.dataFuture = make([]Object, observ.maxDataFuture)
	return observ
}

//Eh... can't do it in the constructor as our parent embeds us, yet wants
//	to pass us a member function... so this will work
func (o *ObservBase) SetCallback(setCallback func(data Object)) {
	o.setCallback = setCallback
}

func (o *ObservBase) set(value Object) {
	if o.dataChanging {
		if o.dataFutureCount >= o.maxDataFuture {
			panic("Observ buffer size exceeded, your observs likely form an infinite loop")
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

func (o *ObservBase) change(data Object) {
	o.setCallback(data)
}
