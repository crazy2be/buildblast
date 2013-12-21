package observT

import (
	"buildblast/lib/observ"
	_ "fmt"
)

type ObservCallback_int func(data int)

//Not thread safe
type Observ_int struct {
	base *observ.Observ
}

func NewObserv_int(owner observ.DisposeExposed, initialData int) *Observ_int {
	return &Observ_int{observ.NewObserv(owner, initialData)}
}

func (o *Observ_int) Set(data int) {
	o.base.Set(data)
}

func (o *Observ_int) Get() int {
	return o.base.Get().(int)
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observ_int) OnChanged(owner observ.CallbackOwner, callback ObservCallback_int) int {
	return o.base.OnChanged(owner, func(obj observ.Object) {
		callback(obj.(int))
	})
}

func (o *Observ_int) MarshalJSON() ([]byte, error) {
	return o.base.MarshalJSON()
}

func (o *Observ_int) GetBase() *observ.Observ {
	return o.base
}
