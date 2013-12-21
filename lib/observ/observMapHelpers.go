package observ

func (o *ObservMap) Set(key Object, value Object) {
	o.set(KVP{key, value})
}

func (o *ObservMap) Delete(key Object) {
	o.set(KVP{key, nil})
}

func (o *ObservMap) GetKeys() []Object {
	keys := []Object{}
	for key, _ := range o.data {
		keys = append(keys, key)
	}
	return keys
}
func (o *ObservMap) GetValues() []Object {
	values := []Object{}
	for _, value := range o.data {
		values = append(values, value)
	}
	return values
}

func (o *ObservMap) Clear() {
	for key, _ := range o.data {
		o.Delete(key)
	}
}
