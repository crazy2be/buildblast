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
	SyncObjectDebug(conn, owner, name, obj, false)
}

func SyncObjectDebug(conn *ClientConn, owner observ.CallbackOwner, name string, obj interface{}, verbose bool) {
	conn.Send(&MsgKoIntegrate{
		Name: name,
		Value: obj,
	})
	
	keepSyncedDebug(conn, owner, name, obj, verbose)
}

func keepSynced(conn *ClientConn, owner observ.CallbackOwner, name string, obj interface{}) {
	keepSyncedDebug(conn, owner, name, obj, false)
}

func keepSyncedDebug(conn *ClientConn, owner observ.CallbackOwner, name string, obj interface{}, verbose bool) {
	if verbose {
		fmt.Println("Syncing", name)
	}
	
	//Lol, this function has gotten out of control
	customIteration := false
	
	//Now we use reflection to recursively find observables in obj, so we can keep it synced
	typ := reflect.TypeOf(obj)
	
	obs := (*observ.Observ)(nil)
	
	//Eh... should probably not do it based on name
	_, hasBaseFnc := typ.MethodByName("GetBase")
	if hasBaseFnc {
		baseFnc := reflect.ValueOf(obj).MethodByName("GetBase")
		obs = baseFnc.Call([]reflect.Value{})[0].Interface().(*observ.Observ)
		if verbose {
			fmt.Println("Found obs from base", obs)
		}
	}
	
	if typ.AssignableTo(reflect.TypeOf((*observ.Observ)(nil))) {
		obs = obj.(*observ.Observ)
		
		if verbose {
			fmt.Println("Found obs from given", obs)
		}
	}
	
	if obs != nil {
		obs.OnChanged(owner, func(_ observ.Object){	
			conn.Send(&MsgKoIntegrate{
				Name: name,
				Value: obs,
			})
		})
	}
	
	
	obsMap := (*observ.ObservMap)(nil)
	
	//Eh... should probably not do it based on name
	_, hasBaseFncMap := typ.MethodByName("GetMapBase")
	if hasBaseFncMap {
		baseFnc := reflect.ValueOf(obj).MethodByName("GetMapBase")
		obsMap = baseFnc.Call([]reflect.Value{})[0].Interface().(*observ.ObservMap)
		if verbose {
			fmt.Println("Found obs mp from base", obsMap)
		}
	}
	
	if typ.AssignableTo(reflect.TypeOf((*observ.ObservMap)(nil))) {
		obsMap = obj.(*observ.ObservMap)
		if verbose {
			fmt.Println("Found obs map from given", obsMap)
		}
	}
	
	if obsMap != nil {
		customIteration = true
		
		obsMap.OnAdd(owner, func(key observ.Object, value observ.Object){
			//Ugh... should probably merge this with the code in observSerialization...
			KVPs := make(map[string]observ.Object)
			keyStr := fmt.Sprintf("%s", key)
			KVPs[keyStr] = value
			
			conn.Send(&MsgKoIntegrate{
				Name: name,
				Value: &observ.ObservMapSerialized{
					KVPs: KVPs,
					Type: "ObservableMap",
				},
			})
			
			subName := name + "." + keyStr
			
			keepSyncedDebug(conn, owner, subName, value, verbose)
		})
		
		obsMap.OnRemove(owner, func(key observ.Object, value observ.Object){
			//Ugh... should probably merge this with the code in observSerialization...
			KVPs := make(map[string]observ.Object)
			keyStr := fmt.Sprintf("%s", key)
			KVPs[keyStr] = nil
			
			conn.Send(&MsgKoIntegrate{
				Name: name,
				Value: &observ.ObservMapSerialized{
					KVPs: KVPs,
					Type: "ObservableMap",
				},
			})
		})
		
		obsMap.OnChange(owner, func(key observ.Object, value observ.Object){			
			//Ugh... should probably merge this with the code in observSerialization...
			KVPs := make(map[string]observ.Object)
			keyStr := fmt.Sprintf("%s", key)
			KVPs[keyStr] = value
			
			conn.Send(&MsgKoIntegrate{
				Name: name,
				Value: &observ.ObservMapSerialized{
					KVPs: KVPs,
					Type: "ObservableMap",
				},
			})
		})
	}
	
	
	if customIteration { return }
	
	//Hmm... can probably do this more efficient... but w/e
	//	(also, could probably cache a lot of this stuff, but also w/e)...
	//	keepSynced won't be called often (unless we have maps which are often
	//	mutated... hmm...)
	val := reflect.ValueOf(obj)
	
	if verbose {
		fmt.Println("Kind", val.Kind())
	}
	
	for val.Kind() == reflect.Ptr {
		if verbose {
			fmt.Println("Pointer indirection")
		}
		val = val.Elem()
		typ = typ.Elem()
		
		if verbose {
			fmt.Println("New Kind", val.Kind())
		}
	}
	
	if(val.Kind() != reflect.Struct) { return }
	
	numFields := val.NumField()
	
	if verbose {
		fmt.Println(name, "has", numFields, "fields")
	}
	
	for ix := 0; ix < numFields; ix++ {
		subField := val.Field(ix)
		
		if !subField.CanSet() { continue }
		
		subName := name + "." + typ.Field(ix).Name
		
		keepSyncedDebug(conn, owner, subName, subField.Interface(), verbose);
	}
}