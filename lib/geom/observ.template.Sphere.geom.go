package geom

import (
	_ "fmt"
	"buildblast/lib/observ"
)

type ObservCallback_Sphere func (data Sphere)

//Not thread safe
type Observ_Sphere struct {
	base *observ.Observ
}

func NewObserv_Sphere(owner observ.DisposeExposed, initialData Sphere) *Observ_Sphere {
	return &Observ_Sphere{observ.NewObserv(owner, initialData)}
}

func (o *Observ_Sphere) Set(data Sphere) {
	o.base.Set(data)
}

func (o *Observ_Sphere) Get() Sphere {
	return o.base.Get().(Sphere)
}

//Just a really handy function, should always be called, unless you know for sure the
//	object you are observing will outlast you.
func (o *Observ_Sphere) OnChanged(owner observ.CallbackOwner, callback ObservCallback_Sphere) int {
	return o.base.OnChanged(owner, func(obj observ.Object) {
		callback(obj.(Sphere))
	})
}

func (o *Observ_Sphere) MarshalJSON() ([]byte, error) {
	return o.base.MarshalJSON();
}

func (o *Observ_Sphere) GetBase() *observ.Observ {
	return o.base
}