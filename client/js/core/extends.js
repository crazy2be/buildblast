define(function () {
//Typescript extends function
	return function __extends(derived, base) {
		for (var property in base) {
			if (base.hasOwnProperty(property)) {
				derivded[propetry] = base[propetry];
			}
		}
		function classDef() {
			this.constructor = derived; 
		}
		classDef.prototype = base.prototype;
		derived.prototype = new classDef();
	};
});
