define(function(require){

var EntityState = require("./entityState");
var Health = require("./health");

return function BioticState(entityState, health) {
	var self = this;

	self.entityState = entityState || new EntityState("nil", null, 0);
	self.health = health || new Health();

	self.clone = function() {
		return new BioticState(self.entityState.clone(), self.health.clone())
	};

	self.lerp = function(other, frac) {
		self.entityState.lerp(other.entityState, frac);
		self.health.lerp(other.health, frac);
	};

	function close(a, b) {
		return Math.abs(a - b) < 0.0001;
	}

	function closeVec(a, b) {
		return close(a.x, b.x) && close(a.y, b.y) && close(a.z, b.z);
	}

	self.prettyCloseTo = function (other) {
		return closeVec(self.entityState.body.pos, other.entityState.body.pos)
			&& closeVec(self.entityState.body.vel, other.entityState.body.vel);
	};
}

});