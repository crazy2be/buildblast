define(function(require) {
	var ko = require("knockout");
	
	//Ehh... don't call new on this... problems will arise
	return function ctorObservableMap() {
		var mapObserv = ko.observable({});
		
		//TODO: Do message queuing...
		//Slightly different interface than observMap.go
		
		mapObserv.curCallbackNum = 0;
		
		mapObserv.addCallbacks = [];
		mapObserv.removeCallbacks = [];
		mapObserv.changeCallbacks = [];
		
		function triggerCallback(callback) {
			var data = mapObserv();
			for(var key in data) {
				var value = data[key];
				callback(key, value);
			}
		}
		
		function makeCallbackFnc(callbacks, triggerImmediately) {
			return function(callback) {
				callbacks.push(callback);
				if(triggerImmediately) {
					triggerCallback(callback);
				}
			}
		}
		
		mapObserv.Add = function(key, value, koIntegrateFnc) {
			var data = mapObserv();
			if(data[key]) {
				console.error("Tried to add existing key to map ", key, data);
				return;
			}
			if(koIntegrateFnc) {
				koIntegrateFnc(data, key, value);
			} else {
				data[key] = value;				
			}
			added(key, value);
			changed(key, value);
			mapObserv.valueHasMutated();
		}
		
		mapObserv.Remove = function(key) {
			var data = mapObserv();
			if(!data[key]) {
				console.error("Tried to remove non-existent key from map ", key, data);
				return;
			}
			var prevValue = data[key];
			delete data[key];
			removed(key, prevValue);
			mapObserv.valueHasMutated();
		}
		
		mapObserv.Set = function(key, value, koIntegrate) {
			var data = mapObserv();
			if(!data[key]) {
				console.error("Tried to change non-existent key in map ", key, data);
				return;
			}
			if(koIntegrate) {
				koIntegrate(data, key, value);
			} else {
				data[key] = value;				
			}
			changed(key, value);
			mapObserv.valueHasMutated();
		}
		
		mapObserv.Get = function(key) {
			return mapObserv()[key];
		}
		
		function added(key, value) {
			mapObserv.addCallbacks.forEach(function(callback) {
				callback(key, value);
			});
		}
		function removed(key, value) {
			mapObserv.removeCallbacks.forEach(function(callback) {
				callback(key, value);
			});
		}
		function changed(key, value) {
			mapObserv.changeCallbacks.forEach(function(callback) {
				callback(key, value);
			});
		}
		
		mapObserv.OnAdd = makeCallbackFnc(mapObserv.addCallbacks, true);
		mapObserv.OnRemove = makeCallbackFnc(mapObserv.removeCallbacks, true);
		mapObserv.OnChange = makeCallbackFnc(mapObserv.changeCallbacks, false);
		
		mapObserv.CtorObservableArray = function() {	
			var obsArrayMap = {};
			
			var observArray = ko.observableArray();
			mapObserv.OnAdd(function(key, value){
				var observ = ko.observable(value);
				obsArrayMap[key] = observ;
				observArray.push(observ);
			});
			mapObserv.OnRemove(function(key, value){
				//Will cause problems if the same value is in the map multiple times...
				for(var ix = observArray.length - 1; ix >= 0; ix--) {
					if(observArray()[ix]() !== value) continue;
					observArray.splice(ix, 1);
				}
				delete obsArrayMap[key];
			});
			mapObserv.OnChange(function(key, value){
				obsArrayMap[key](value);
			});
			
			return observArray;
		}
		
		return mapObserv;
	}
});