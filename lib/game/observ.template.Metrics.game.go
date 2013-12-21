package game

import (
	"buildblast/lib/observ"
	_ "fmt"
)

type ObservCallback_Metrics func(data Metrics)

//Not thread safe
type Observ_Metrics struct {
	base *observ.Observ
}

func NewObserv_Metrics(owner observ.DisposeExposed, initialData Metrics) *Observ_Metrics {
	return &Observ_Metrics{observ.NewObserv(owner, initialData)}
}

func (o *Observ_Metrics) Set(data Metrics) {
	o.base.Set(data)
}

func (o *Observ_Metrics) Get() Metrics {
	return o.base.Get().(Metrics)
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observ_Metrics) OnChanged(owner observ.CallbackOwner, callback ObservCallback_Metrics) int {
	return o.base.OnChanged(owner, func(obj observ.Object) {
		callback(obj.(Metrics))
	})
}

func (o *Observ_Metrics) MarshalJSON() ([]byte, error) {
	return o.base.MarshalJSON()
}

func (o *Observ_Metrics) GetBase() *observ.Observ {
	return o.base
}
