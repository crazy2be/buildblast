define(function(require){

var Body = require("physics/body");

/**
 * @param entityId type=string
 * @param lastUpdated type=float64
 * @param body type=physics.Body
 */
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