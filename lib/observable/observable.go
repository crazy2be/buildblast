package observable

type ObservCallback func (newValue Object, oldValue Object)

//Not thread safe
type Observable struct {
	data				Object
	changedCallbacks	map[CallbackOwner]ObservCallback
}

func NewObservable(initialData Object) *Observable {
	observ := new(Observable)
	observ.data = initialData
	observ.changedCallbacks = make(map[CallbackOwner]ObservCallback, 0)
	return observ
}

func (o *Observable) Set(value Object) Object {
	prevValue := o.data
	o.data = value

	o.changed(prevValue)

	return prevValue
}

func (o *Observable) Get() Object {
	return o.data
}

func (o *Observable) changed(newValue Object) {
	for _, callback := range o.changedCallbacks {
		callback(newValue, o.data)
	}
}

func (o *Observable) OnChanged(owner CallbackOwner, callback ObservCallback) {
	o.changedCallbacks[owner] = callback
	owner.OnDispose(func() {
		o.NotOnChanged(owner)
	})
	callback(o, nil)
}
func (o *Observable) NotOnChanged(owner CallbackOwner) {
	delete(o.changedCallbacks, owner)
}