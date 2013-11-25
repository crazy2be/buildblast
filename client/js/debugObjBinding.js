define(function(require) {

	var ChunkManager = require("chunkManager");
	var EntityManager = require("entities/entityManager");

	var common = require("chunks/chunkCommon");
	var colorPicker = require("shared/colorPicker");
	
	var ko = require("knockout");
	
	var $ = require("jquery");

	//We polute the object hierarchy sooo much... as long as anything speed critical is private
	//	inside world we should be fine though...

	function makeIndents(level) {
		var text = '';
		while(level --> 0) {
			text += ' ';
		}
		return text;
	}

	function firstProp(obj) {
		for(var key in obj) {
			return obj[key];
		}
	}

	function LhsHasRhs(lhs, rhs) {
		if (typeof rhs !== 'object') {
			return lhs === rhs;
		}
		for (var key in rhs) {
			var rhsValue = rhs[key];
			var lhsValue = lhs[key];
			if (!LhsHasRhs(lhsValue, rhsValue)) return false;
		}
		return true;
	}
	
	function ObjEqual(lhs, rhs) {
		return LhsHasRhs(lhs, rhs) && LhsHasRhs(lhs, rhs)
	}

	function StripObservables(obj) {
		var copy;
		if(typeof obj === 'function') {
			if(!obj.subscribe) return;
			copy = obj();
		}
		
		if(typeof obj !== 'object') {
			return obj;
		}
		
		copy = {};
		for(var key in obj) {
			copy[key] = StripObservables(obj[key]);
		}
		return copy;
	}

	//We have no recursive handingly... so don't do that...
	//	(adding/removing in an onAdd/onRemove)
	function MapObservable(observ, myObjsRequireOnChanged) {
		var self = this;
		
		var cachedData = observ();
		observ.subscribe(onNewData);
			
		function onNewData(newData){
			var removedKeys = {};
			var addedKeys = {};
			var changedKeys = {}
			
			for(var key in newData) {				
				if(newData[key].name === "dependentObservable") continue;
				
				var newDatum = StripObservables(newData[key]);
				
				if(typeof cachedData[key] === 'undefined') {
					addedKeys[key] = key;
				} else if(myObjsRequireOnChanged) {
					var oldDatum = StripObservables(cachedData[key]);
					
					//Treat it as a removed AND added
					var old = cachedData[key];
					var newO = newData[key];
					if(!ObjEqual(newDatum, oldDatum)) {
						changedKeys[key] = key;
					}
				}
			}
			
			for(var key in cachedData) {
				if(cachedData[key].name === "dependentObservable") continue;
				if(typeof newData === 'undefined') {
					removedKeys[key] = key;
				}
			}
			
			
			for(var key in removedKeys) {
				removed(key, cachedData[key]);
			}
			
			for(var key in addedKeys) {
				added(key, newData[key]);
			}
			
			for(var key in changedKeys) {
				changed(key, newData[key]);
			}
			
			cachedData = {};
			for(var key in newData) {				
				if(newData[key].name === "dependentObservable") continue;
				
				var newDatum = StripObservables(newData[key]);
				cachedData[key] = newDatum;
			}
		}
		
		function removed(key, value) {
			addCallbacks.forEach(function(callback){
				callback(key, value);
			})
		}
		function added(key, value) {
			removeCallbacks.forEach(function(callback){
				callback(key, value);
			})
		}
		function changed(key, value) {
			changedCallbacks.forEach(function(callback){
				callback(key, value);
			})
		}
		
		var addCallbacks = [];
		var removeCallbacks = [];
		var changedCallbacks = [];
		
		self.onAdd = function(callback) {
			addCallbacks.push(callback);
			
			for(var key in cachedData) {
				if(cachedData[key].name === "dependentObservable") continue;
				callback(key, cachedData[key]);
			}
		}
		
		self.onRemove = function(callback) {
			removeCallbacks.push(callback);
		}
		
		self.onChange = function(callback) {
			if(!myObjsRequireOnChanged) throw "You must specify you need on change if you want to use it (in the constructor)";
			
			changedCallbacks.push(callback);
		}
		
		self.valueHasMutated = function() {
			onNewData(observ());
		}
		
		self.set = function(data) {
			observ(data);
		}
	}

	//TODO: Accept and observable and handle updates efficiently..
	ko.bindingHandlers.foreachObject = {
		init: function(element, valueAccessor) {
			var templateElems = [];
			while(element.firstChild) {
				var child = element.firstChild;
				element.removeChild(child);
				templateElems.push(child);
			}
			
			var data = valueAccessor();
			for(var key in data) {
				var subData = data[key];
				if(typeof subData === 'function') {
					if(!subData.subscribe) continue;
					subData = subData();
					if(typeof firstProp(subData) === 'undefined') continue;
				}
				templateElems.forEach(function(templateElem) {
					var clonedElem = templateElem.cloneNode(true);
					ko.cleanNode(clonedElem); //Eh... may not be needed
					
					element.appendChild(clonedElem);
					if(clonedElem.nodeType !== 1 && clonedElem.nodeType !== 8) return;
					ko.applyBindings({key: key, data: subData}, clonedElem);
				})
			}

			return { controlsDescendantBindings: true };
		}
	}

	var selectedNode = ko.observable();
	
	//Hmm... I don't clean this up... it is just for linking parents with children
	var ourNodes = {};
	
	var root;
	
	var curNumber = 1;
	ko.bindingHandlers.debugDisplayNode = {
		init: function(element, valueAccessor) {
			var params = valueAccessor();
			var name = params.name;
			var data = params.data;
			var level = params.level;
			var isObserv = params.isObserv;
			
			if(isObserv) {
				name = "(obs)" + name;
			}
			
			var ourNumber = curNumber++;
			
			var parentID = params.parentID;
			
			element.setAttribute("debugID", ourNumber);
			
			var localData = {ID: ourNumber, parentID: parentID, children: []};
			ourNodes[ourNumber] = localData;
			localData.data = data;
			localData.level = level;
			localData.name = name;
			localData.isObserv = isObserv;
			localData.elem = element;
			
			localData.getData = function() {
				if(localData.isObserv) {
					return localData.data.obs();
				} else {
					return localData.data;
				}
			}
			
			localData.isObj = typeof localData.getData() === 'object';
			
			
			if(!selectedNode()) {
				selectedNode(localData);
			}
			
			if(parentID) {
				localData.parent = ourNodes[parentID]
				ourNodes[parentID].children.push(localData);
			} else {
				root = localData;
			}
			
			var selIndiNode;
			
			localData.selected = ko.observable(false);
			localData.selected.subscribe(function(selected){
				if(selected) {
					selIndiNode.style.backgroundColor = "yellow";
				} else {
					selIndiNode.style.backgroundColor = "";
				}
			});
			
			selectedNode.subscribe(function(selectedNode) {
				localData.selected(selectedNode === localData);
			});
			
			
			
			if(!localData.isObj) {
				var leafNode = document.createElement('div');
				selIndiNode = leafNode;
				
				element.appendChild(leafNode);
				
				localData.refresh = function(data) {
					localData.data = data;
					var titlePart = localData.name + ": ";
					leafNode.textContent = makeIndents(localData.level * 4) + titlePart + localData.getData();
				};
				
				if(localData.isObserv) {
					localData.data.obs.subscribe(function() {
						localData.refresh(localData.data);
					});
				}
				
			} else {
				var titleNode = document.createElement('div');
				titleNode.textContent = makeIndents(localData.level * 4) + localData.name;
				element.appendChild(titleNode);
				
				selIndiNode = titleNode;
				
				
				var ourObserv = localData.isObserv ? 
					localData.data.obs :
					ko.observable(localData.data);
				
				var mapObs = new MapObservable(ourObserv, true);
				
				localData.refresh = function(data) {
					localData.data = data;
					ourObserv(localData.getData());
				};
		
				var subLevel = localData.level + 1;
		
				mapObs.onAdd(function(key, value){
					var subData = value;
					var isObservSub = false;
					if(typeof subData === 'function') {
						if(!subData.subscribe) return;
						isObservSub = true;
					}
					
					var debugNode = document.createElement('div');

					debugNode.setAttribute('data-bind', 
						'debugDisplayNode: {name: "'+key+'", '
						+ 'data: $data, '
						+ 'level: '+subLevel+', '
						+ 'parentID: '+localData.ID+', '
						+ 'isObserv: '+isObservSub+', '
						+'}');
						
					element.appendChild(debugNode);

					ko.applyBindings(isObservSub ? { obs: subData } : subData, debugNode);
					
				});
				
				//This code may not work... (never tested it)
				mapObs.onRemove(function(key, value){
					var childs = localData.children;
					for(var ix = childs.length - 1; ix >= 0; ix--) {
						var child = childs[ix];
						if(child.data === value) {
							childs.splice(ix, 1);
							element.removeChild(child.elem);
						}
					}
				});
				
				mapObs.onChange(function(key, value){
					for(var k in localData.children) {
						var child = localData.children[k];
						if(child.name !== key) continue;
						child.refresh(value);
					}
				})
			}
			
			localData.refresh(localData.data);
			
			return { controlsDescendantBindings: true };
		}
	};

	ko.bindingHandlers.debugObj = {
		init: function(element, valueAccessor) {
			var debugDisplay = document.createElement('div');
			
			var dataSource = valueAccessor();
			
			//Give the world some time to populate (our update logic is non-existent, so we don't recognize new properties)
			setTimeout(function () {
				debugDisplay.setAttribute('data-bind', 'debugDisplayNode: {name: "ALT-Space to collapse", data: $data, level: -1}');

				element.appendChild(debugDisplay);

				//debugDisplay.appendChild(objectToNestedDivs(plainObject, 0));
				ko.applyBindings(dataSource, debugDisplay);
			}, 500);
			
			$('#container').keydown(function(event){
				if(!$(element).is(":visible")) return;
				if(!event.altKey) return;
				
				var curNode = selectedNode();
				switch(event.keyCode) {
				case 32: //' ', toggle collapsed
					curNode.collapsed(!curNode.collapsed());
					break;
				case 37: //left arrow, move to parent node
					if(!curNode.parent) return;
					selectedNode(curNode.parent);
					break;
				case 38: //up arrow, move to sibling node
					if(!curNode.parent) return;
					var prevSibling;
					for(var key in curNode.parent.children) {
						var sibling = curNode.parent.children[key];
						if(sibling === curNode) {
							break;
						}
						prevSibling = sibling;
					}
					if(!prevSibling) return;
					selectedNode(prevSibling);
					break;
				case 39: //right arrow, move to first child node
					var firstChild = firstProp(curNode.children);
					if(!firstChild) return;
					selectedNode(firstChild);
					break;
				case 40: //down arrow, move to sibling node
					if(!curNode.parent) return;
					var breakNext;
					var nextSibling;
					for(var key in curNode.parent.children) {
						var sibling = curNode.parent.children[key];
						nextSibling = sibling;
						if(breakNext) break;
						if(sibling === curNode) {
							breakNext = true;
						}
					}
					if(!nextSibling) return;
					selectedNode(nextSibling);
					break;
				}
			});
			
			return { controlsDescendantBindings: true };
		}
	}
	
	ko.bindingHandlers.showHideDebug = {
		init: function(element, valueAccessor) {
			var otherElement = $(valueAccessor());
			otherElement.hide();
			var visible = localStorage.debugVisible === "true";
			
			function applyVisibility() {
				if(visible) {
					otherElement.show();
				} else {
					otherElement.hide();
				}
			}
			
			applyVisibility();
			
			$('#container').keydown(function(event){
				//the ` key
				switch(event.keyCode) {
				case 192:
					visible = !visible;
					localStorage.debugVisible = visible;
					applyVisibility();
					break;
				}
			});
		}
	}
});