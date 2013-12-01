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
	//Now we use reflection to recursively find observables in obj, so we can keep it synced
	typ := reflect.TypeOf(obj)
	
	//Eh... should probably not do it based on name
	_, hasBaseFnc := typ.MethodByName("GetBase")
	if hasBaseFnc {
		baseFnc := reflect.ValueOf(obj).MethodByName("GetBase")
		obs := baseFnc.Call([]reflect.Value{})
		fmt.Println("Found obs", obs)
	}
	
	/*
	numFields := type.NumField()
	
	for ix := 0; ix < numFields; ix++ {
		subField := typ.Field(ix)
	}
	*/
}