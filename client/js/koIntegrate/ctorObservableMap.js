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
		
		mapObserv.Add = function(key, value) {
			var data = mapObserv();
			if(data[key]) {
				console.error("Tried to add existing key to map ", key, data);
				return;
			}
			data[key] = value;
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
		
		mapObserv.Set = function(key, value) {
			var data = mapObserv();
			if(!data[key]) {
				console.error("Tried to change non-existent key in map ", key, data);
				return;
			}
			data[key] = value;
			changed(key, value);
			mapObserv.valueHasMutated();
		}
		
		function added(key, value) {
			mapObserv.addCallbacks.forEach(triggerCallback);
		}
		function removed(key, value) {
			mapObserv.addCallbacks.forEach(triggerCallback);
		}
		function changed(key, value) {
			mapObserv.addCallbacks.forEach(triggerCallback);
		}
		
		mapObserv.OnAdd = makeCallbackFnc(mapObserv.addCallbacks, true);
		mapObserv.OnRemove = makeCallbackFnc(mapObserv.removeCallbacks, true);
		mapObserv.OnChange = makeCallbackFnc(mapObserv.changeCallbacks, false);
		
		return mapObserv;
	}
});