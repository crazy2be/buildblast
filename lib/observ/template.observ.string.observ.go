package observ

import (
	_ "fmt"
)

type ObservCallback_string func (data string)

//Not thread safe
type Observ_string struct {
	base *Observ
}

func NewObserv_string(owner DisposeExposed, initialData string) *Observ_string {
	return &Observ_string{NewObserv(owner, initialData)}
}

func (o *Observ_string) Set(data string) {
	o.base.Set(data)
}

func (o *Observ_string) Get() string {
	return o.base.Get().(string)
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observ_string) OnChanged(owner CallbackOwner, callback ObservCallback_string) int {
	return o.base.OnChanged(owner, func(obj Object) {
		callback(obj.(string))
	})
}
