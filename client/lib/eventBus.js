function EventBus() {
	var self = this;
	var callbacks = {};

	// remove modifies the list which it is passed,
	// removing all occurances of val.
	function remove(list, val) {
		for (var i = 0; i < list.length; i++) {
			if (list[i] === val) {
				list.splice(i, 1);
			}
		}
	}

	self.on = function (ev, cb) {
		var list = callbacks[ev] || [];
		list.push(cb);
		callbacks[ev] = list;
		return self;
	}

	self.off = function (ev, cb) {
		var list = callbacks[ev];
		if (!list) return;
		remove(list, cb);
		return self;
	}

	self.fire = function (ev, arg1, arg2/*, ...*/) {
		var list = callbacks[ev];
		if (!list) return;
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < list.length; i++) {
			list[i].apply(null, args);
		}
		return self;
	}
}
