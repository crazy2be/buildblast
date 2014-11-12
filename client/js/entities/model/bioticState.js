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

	self.prettyCloseTo = function (other) {
		return close(self.entityState.body.pos.x, other.entityState.body.pos.x) &&
			close(self.entityState.body.pos.y, other.entityState.body.pos.y) &&
			close(self.entityState.body.pos.z, other.entityState.body.pos.z) &&
			close(self.entityState.body.dir.x, other.entityState.body.dir.x) &&
			close(self.entityState.body.dir.y, other.entityState.body.dir.y) &&
			close(self.entityState.body.dir.z, other.entityState.body.dir.z) &&
			close(self.entityState.body.vel.x, other.entityState.body.vel.x) &&
			close(self.entityState.body.vel.y, other.entityState.body.vel.y) &&
			close(self.entityState.body.vel.z, other.entityState.body.vel.z) &&
			close(self.health.life, other.health.life);
	};
}

});