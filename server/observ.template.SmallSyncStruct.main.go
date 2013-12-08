package main

import (
	_ "fmt"
	"buildblast/lib/observ"
)

type ObservCallback_SmallSyncStruct func (data SmallSyncStruct)

//Not thread safe
type Observ_SmallSyncStruct struct {
	base *observ.Observ
}

func NewObserv_SmallSyncStruct(owner observ.DisposeExposed, initialData SmallSyncStruct) *Observ_SmallSyncStruct {
	return &Observ_SmallSyncStruct{observ.NewObserv(owner, initialData)}
}

func (o *Observ_SmallSyncStruct) Set(data SmallSyncStruct) {
	o.base.Set(data)
}

func (o *Observ_SmallSyncStruct) Get() SmallSyncStruct {
	return o.base.Get().(SmallSyncStruct)
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observ_SmallSyncStruct) OnChanged(owner observ.CallbackOwner, callback ObservCallback_SmallSyncStruct) int {
	return o.base.OnChanged(owner, func(obj observ.Object) {
		callback(obj.(SmallSyncStruct))
	})
}

func (o *Observ_SmallSyncStruct) MarshalJSON() ([]byte, error) {
	return o.base.MarshalJSON();
}

func (o *Observ_SmallSyncStruct) GetBase() *observ.Observ {
	return o.base
}