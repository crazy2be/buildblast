define(function (require) {
	var THREE = require("THREE");

	function addNaNWatch(obj, propertyName) {
			hash = {};
			hash[propertyName] = {
					get: function () {
							return this["_" + propertyName];
					},
					set: function(val) {
							if (val !== val || val === undefined) {
									throw "Invalid value for " + propertyName;
							}
							this["_" + propertyName] = val;
					}
			}
			Object.defineProperties(obj, hash);
	}

	var DVector3 = function (x, y, z) {
			addNaNWatch(this, "x");
			addNaNWatch(this, "y");
			addNaNWatch(this, "z");
			this.x = x; this.y = y; this.z = z;
			this.clone = function () {
				return new DVector3(this.x, this.y, this.z);
			}
	}

	DVector3.prototype = THREE.Vector3.prototype;

	return {
		addNaNWatch: addNaNWatch,
		DVector3: DVector3,
	};
});
