define(function(require) {

	var ChunkManager = require("chunkManager");
	var EntityManager = require("entities/entityManager");

	var common = require("chunks/chunkCommon");
	var colorPicker = require("shared/colorPicker");
	
	var ko = require("knockout");
	
	var $ = require("jquery");

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
		if(lhs === rhs) return true;
		if (typeof lhs !== 'object' || typeof rhs !== 'object') {
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
		return LhsHasRhs(lhs, rhs) && LhsHasRhs(rhs, lhs)
	}

	function StripObservables(obj) {
		if(typeof obj === 'function') {
			if(!obj.subscribe) return;
			obj = obj();
		}
		
		if(typeof obj !== 'object') {
			return obj;
		}
		
		var copy = {};
		for(var key in obj) {
			copy[key] = StripObservables(obj[key]);
		}
		return copy;
	}
	
	//We have no recursive handingly... so don't do that...
	//	(adding/removing in an onAdd/onRemove)
	function MapObservable(observ, myObjsRequireOnChanged) {
		var self = this;
		
		var cachedData = {};
		var curData = observ();
		observ.subscribe(onNewData);
			
		function Skip(obj) {
			return obj && typeof obj === 'function' && (obj.name === "dependentObservable" || !obj.subscribe);
		}
			
		function onNewData(newData){
			var removedKeys = {};
			var addedKeys = {};
			var changedKeys = {}
			
			for(var key in newData) {				
				if(Skip(newData[key])) continue;
				
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
				if(Skip(cachedData[key])) continue;
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
				if(Skip(newData[key])) continue;
				
				var newDatum = StripObservables(newData[key]);
				cachedData[key] = newDatum;
			}
			
			curData = newData;
		}
		
		function added(key, value) {
			addCallbacks.forEach(function(callback){
				callback(key, value);
			})
		}
		function removed(key, value) {
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
			
			for(var key in curData) {
				if(Skip(curData[key])) continue;
				callback(key, curData[key]);
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
		
		onNewData(observ());
	}

	var runningAnims = {};
	var minTime = 1 / 60 * 1000;
	function applyAnimation(elem, className) {
		var curTime = new Date().getTime();
		var debugID = elem.parentElement.getAttribute("debugID");
		if(runningAnims[debugID] + minTime > curTime) return;
		runningAnims[debugID] = curTime;
		
		$(elem).on('webkitAnimationEnd', function() {
			runningAnims[debugID] = 0;
		})
		
		$(elem).removeClass(className);
		setTimeout(function(){
			$(elem).addClass(className);
		}, 0)
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
			var isObserv = params.isObserv || (data && data.obs);
			var displayedName = name;
			
			if(isObserv) {
				displayedName = "(obs)" + name;
				data = data.obs;
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
			localData.displayedName = displayedName;
			
			localData.getData = function() {
				if(localData.isObserv) {
					return localData.data();
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
			
			localData.collapsed = ko.observable(false);
			
			localData.collapsed.subscribe(function(collapse){
				localData.children.forEach(function(child){
					if(collapse) {
						$(child.elem).hide();
					} else {
						$(child.elem).show();
					}
				})
			})
			
			
			if(!localData.isObj) {
				var leafNode = document.createElement('div');
				selIndiNode = leafNode;
				
				element.appendChild(leafNode);
				
				localData.refresh = function(data) {
					applyAnimation(selIndiNode, "observChanged");
					
					localData.data = data;
					var titlePart = localData.displayedName + ": ";
					leafNode.textContent = makeIndents(localData.level * 4) + titlePart + localData.getData();
				};
				
				if(localData.isObserv) {
					localData.data.subscribe(function() {
						localData.refresh(localData.data);
					});
				}
				
			} else {
				var titleNode = document.createElement('div');
				titleNode.textContent = makeIndents(localData.level * 4) + localData.displayedName;
				element.appendChild(titleNode);
				
				selIndiNode = titleNode;
				
				var ourObserv = localData.isObserv ? 
					localData.data :
					ko.observable(localData.data);
				
				var mapObs = new MapObservable(ourObserv, true);
				
				localData.refresh = function(data) {
					localData.data = data;
					
					applyAnimation(selIndiNode, "observChanged");
					//ourObserv.valueHasMutated() will work too... but this is safer
					//	(cause the whole observable may have been destroyed and remade)
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
					applyAnimation(selIndiNode, "observChanged");
					
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

			var dataObserv = ko.observable(dataSource);

			debugDisplay.setAttribute('data-bind', 'debugDisplayNode: {name: "ALT-Space to collapse", data: $data, level: -1}');			
			element.appendChild(debugDisplay);
			ko.applyBindings({obs: dataObserv}, debugDisplay);
			
			//Our top level world doesn't have proper observable structure (or may
			//	not, as this is for debugging that would be something to debug)...
			//	so we have to poll to update it.
			setInterval(function () {
				dataObserv(dataSource);
			}, 500, 500);
			
			$('#container').keydown(function(event){
				if(!$(element).is(":visible")) return;
				if(!event.altKey) return;
				
				function toParent() {
					var curNode = selectedNode();
					if(!curNode.parent) return false;
					selectedNode(curNode.parent);
					return true;
				}
				function toFirstChild() {
					var curNode = selectedNode();
					if(curNode.collapsed()) return false;
					var firstChild = firstProp(curNode.children);
					if(!firstChild) return false;
					selectedNode(firstChild);
					return true;
				}
				function toPrevSibling() {
					var curNode = selectedNode();
					if(!curNode.parent) return false;
					var prevSibling;
					for(var key in curNode.parent.children) {
						var sibling = curNode.parent.children[key];
						if(sibling === curNode) {
							break;
						}
						prevSibling = sibling;
					}
					if(!prevSibling) return false;
					selectedNode(prevSibling);
					return true;
				}
				function toNextSibling() {
					var curNode = selectedNode();
					if(!curNode.parent) return false;
					var breakNext;
					var nextSibling;
					for(var key in curNode.parent.children) {
						var sibling = curNode.parent.children[key];
						if(breakNext) {
							nextSibling = sibling;
							break;
						}
						if(sibling === curNode) {
							breakNext = true;
						}
					}
					if(!nextSibling) return false;
					selectedNode(nextSibling);
					return true;
				}
				function toLastChild() {
					var curNode = selectedNode();
					var breakNext;
					var child;
					for(var key in curNode.children) {
						child = curNode.children[key];
					}
					if(!child) return false;
					selectedNode(child);
					return true;
				}
				
				var curNode = selectedNode();
				switch(event.keyCode) {
				case 32: //' ', toggle collapsed
					curNode.collapsed(!curNode.collapsed());
					break;
				case 37: //left arrow, move to parent node
					toParent();
					break;
				case 38: //up arrow, move to sibling node
					if(!toPrevSibling()) {
						toParent();
					}
					break;
				case 39: //right arrow, move to first child node
					if(!toFirstChild()) {
						if(!toNextSibling()) {
							toParent();
							toNextSibling();
						}
					}
					break;
				case 40: //down arrow, move to sibling node
					if(!toNextSibling()) {
						if(!toFirstChild()) {
							toParent();
							toNextSibling();
						}
					}
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