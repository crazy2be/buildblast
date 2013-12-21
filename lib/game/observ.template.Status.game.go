package game

import (
	"buildblast/lib/observ"
	_ "fmt"
)

type ObservCallback_Status func(data Status)

//Not thread safe
type Observ_Status struct {
	base *observ.Observ
}

func NewObserv_Status(owner observ.DisposeExposed, initialData Status) *Observ_Status {
	return &Observ_Status{observ.NewObserv(owner, initialData)}
}

func (o *Observ_Status) Set(data Status) {
	o.base.Set(data)
}

func (o *Observ_Status) Get() Status {
	return o.base.Get().(Status)
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observ_Status) OnChanged(owner observ.CallbackOwner, callback ObservCallback_Status) int {
	return o.base.OnChanged(owner, func(obj observ.Object) {
		callback(obj.(Status))
	})
}

func (o *Observ_Status) MarshalJSON() ([]byte, error) {
	return o.base.MarshalJSON()
}

func (o *Observ_Status) GetBase() *observ.Observ {
	return o.base
}
