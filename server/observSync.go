package main

import (
	"buildblast/lib/observ"
	"fmt"
	"reflect"
)

func SyncObserv(conn *ClientConn, owner observ.CallbackOwner, name string, obs *observ.Observ) {
	obs.OnChanged(owner, func(val observ.Object){
		conn.Send(&MsgKoIntegrate{
			Name: name,
			Value: obs,
		})
	})
}

func SyncObject(conn *ClientConn, owner observ.CallbackOwner, name string, obj interface{}) {
	conn.Send(&MsgKoIntegrate{
		Name: name,
		Value: obj,
	})
	
	keepSynced(conn, owner, name, obj)
}

func keepSynced(conn *ClientConn, owner observ.CallbackOwner, name string, obj interface{}) {
	//Now we use reflection to recursively find observables in obj, so we can keep it synced
	typ := reflect.TypeOf(obj)
	
	obs := (*observ.Observ)(nil)
	
	//Eh... should probably not do it based on name
	_, hasBaseFnc := typ.MethodByName("GetBase")
	if hasBaseFnc {
		baseFnc := reflect.ValueOf(obj).MethodByName("GetBase")
		obs = baseFnc.Call([]reflect.Value{})[0].Interface().(*observ.Observ)
		fmt.Println("Found obs from base", obs)
	}
	
	if typ.AssignableTo(reflect.TypeOf((*observ.Observ)(nil))) {
		obs = obj.(*observ.Observ)
		fmt.Println("Found obs from given", obs)
	}
	
	if obs != nil {
		obs.OnChanged(owner, func(_ observ.Object){
			conn.Send(&MsgKoIntegrate{
				Name: name,
				Value: obs,
			})
		})
	}
	
	//Hmm... can probably do this more efficient... but w/e
	//	(also, could probably cache a lot of this stuff, but also w/e)...
	//	keepSynced won't be called often (unless we have maps which are often
	//	mutated... hmm...)
	val := reflect.ValueOf(obj)
	
	fmt.Println("Kind", val.Kind())
	
	for val.Kind() == reflect.Ptr {
		fmt.Println("Pointer indirection")
		val = val.Elem()
		typ = typ.Elem()
	}
	
	numFields := val.NumField()
	
	for ix := 0; ix < numFields; ix++ {
		subField := val.Field(ix)
		
		if !subField.CanSet() { continue }
		
		subName := name + "." + typ.Field(ix).Name
		
		keepSynced(conn, owner, subName, subField.Interface());
	}
}