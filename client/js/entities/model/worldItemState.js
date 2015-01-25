define(function(require){

var EntityState = require("./entityState");

return function WorldItemState(entityState, itemKind) {
	var self = this;

	self.entityState = entityState || new EntityState("nil", null, 0);
	self.itemKind = itemKind || 0;

	self.clone = function() {
		return new WorldItemState(self.entityState.clone(), self.itemKind);
	};

	self.lerp = function(other, frac) {
		self.entityState.lerp(other.entityState, frac);
	};
}

});
