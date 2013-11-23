package observable

func (o *ObservableMap) Set(key Object, value Object) {
	o.set(KVP{key, value})
}

func (o *ObservableMap) Delete(key Object) {
	o.set(KVP{key, nil})
}

func (o *ObservableMap) GetKeys() []Object {
    keys := []Object{}
    for key, _ := range o.data {
        keys = append(keys, key)
    }
    return keys
}
func (o *ObservableMap) GetValues() []Object {
    values := []Object{}
    for _, value := range o.data {
        values = append(values, value)
    }
    return values
}

func (o *ObservableMap) Clear() {
    for key, _ := range o.data {
        o.Delete(key)
    }
}