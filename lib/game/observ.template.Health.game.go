package game

import (
	_ "fmt"
	"buildblast/lib/observ"
)

type ObservCallback_Health func (data Health)

//Not thread safe
type Observ_Health struct {
	base *observ.Observ
}

func NewObserv_Health(owner observ.DisposeExposed, initialData Health) *Observ_Health {
	return &Observ_Health{observ.NewObserv(owner, initialData)}
}

func (o *Observ_Health) Set(data Health) {
	o.base.Set(data)
}

func (o *Observ_Health) Get() Health {
	return o.base.Get().(Health)
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observ_Health) OnChanged(owner observ.CallbackOwner, callback ObservCallback_Health) int {
	return o.base.OnChanged(owner, func(obj observ.Object) {
		callback(obj.(Health))
	})
}
