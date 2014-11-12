define(function(require){

var Body = require("physics/body");

return function EntityState(entityId, body, lastUpdated) {
	var self = this;

	self.entityId = entityId;
	self.body = body || new Body();
	self.lastUpdated = lastUpdated;

	self.clone = function() {
		return new EntityState(self.entityId, self.body.clone(), self.lastUpdated);
	};

	self.lerp = function(other, frac) {
		self.body.lerp(other.body, frac);
	};
}

});