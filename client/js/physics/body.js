define(function(require){

var THREE = require("THREE");
var Box = require("./box");

return function Body(pos, vel, dir, halfExtents, centerOffset) {
	var self = this;

	self.pos = pos || new THREE.Vector3(0, 0, 0);
	self.vel = vel || new THREE.Vector3(0, 0, 0);
	self.dir = dir || new THREE.Vector3(0, 0, 0);
	self.halfExtents = halfExtents || new THREE.Vector3(0, 0, 0);
	self.centerOffset = centerOffset || new THREE.Vector3(0, 0, 0);
	self.box = new Box(self.halfExtents, self.centerOffset);

	self.clone = function() {
		return new Body(self.pos.clone(), self.vel.clone(), self.dir.clone(),
				self.halfExtents.clone(), self.centerOffset.clone());
	};

	self.lerp = function(other, frac) {
		self.pos.lerp(other.pos, frac);
		self.vel.lerp(other.vel, frac);
		self.dir.lerp(other.dir, frac);
		self.halfExtents.lerp(other.halfExtents, frac);
		self.centerOffset.lerp(other.centerOffset, frac);
	}
}

});