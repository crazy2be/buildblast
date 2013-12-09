define(function(require) {
	var ko = require("knockout");
	
	var ctorObservableMap = require("./ctorObservableMap");
	
	var SerialCtors = {
		Observable: function() { return ko.observable({}).extend({notify: 'always'}); },
		//Ugh... any normal changes to this observable won't be reflected... you must call the Add, Remove and Set functions
		ObservableMap: ctorObservableMap,
		Default: function(data){
			if(typeof data === 'object') {
				return {};
			} else {
				return -1;
			}
		},
	};
	
	var IntegrateFncs = {
		Observable: function(destHolder, key, newData) {				
			var data = newData.Data;
			if(typeof data === 'object') {
				koIntegrate(destHolder[key](), data)
				destHolder[key].valueHasMutated();
			} else {
				destHolder[key](data);
			}
		}, ObservableMap: function(destHolder, key, newData) {
			var newKVPs = newData.KVPs || newData;
			var observMap = destHolder[key];
			
			for(var key in newKVPs) {
				var value = newKVPs[key];
				if(value === null) {
					//Haven't tested this...
					debugger;
					observMap.Remove(key);
				} else if(observMap()[key]) {
					observMap.Set(key, value, koIntegrateSingle);
				} else {
					observMap.Add(key, value, koIntegrateSingle);
				}
			}
		}, Default: function(destHolder, key, data) {
			if(typeof data === 'object') {
				koIntegrate(destHolder[key], data);
			} else {
				destHolder[key] = data;
			}
		}
	};
	
	function koIntegrateSingle(destHolder, key, newData) {
		if(newData.Type && !SerialCtors[newData.Type]) {
			console.warn("Constructor for " + newData.Type + " cannot be found, just serializing as Object");
		}
		
		var Type = newData.Type || "Default";
		
		if(typeof destHolder[key] !== 'undefined') {
			Type = destHolder[key].Type || Type;
		}
		
		var ctorFnc = SerialCtors[Type];
		var integrateFnc = IntegrateFncs[Type];
		
		if(typeof destHolder[key] === 'undefined') {
			destHolder[key] = ctorFnc(newData);
			destHolder[key].Type = Type;
		}
		
		integrateFnc(destHolder, key, newData);
	}
	
	function koIntegrate(dest, data) {
		//Hmm... basic data types will be observables
		for(var key in data) {		
			koIntegrateSingle(dest, key, data[key]);
		}
		
		return dest;
	}
	
	return function acceptKoIntegrate(world, data) {
		//So much easier to do this repackaging on the Javascript side
		var obj = {};
		var name = data.Name;
		var curName = name;
		var curObj = obj;
		while(name.indexOf(".") >= 0) {
			curName = name.substring(0, name.indexOf("."));
			curObj[curName] = curObj = {};
			name = name.substring(curName.length + 1);
		}
		curObj[name] = data.Value;
		koIntegrate(world, obj);
	}
});