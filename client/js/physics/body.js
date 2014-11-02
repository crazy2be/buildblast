define(function(require){

var THREE = require("THREE");
var Box = require("./box");

/**
 * @param pos          type=THREE.Vector3
 * @param vel          type=THREE.Vector3
 * @param dir          type=THREE.Vector3
 * @param halfExtents  type=THREE.Vector3
 * @param centerOffset type=THREE.Vector3
 */
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
		this.pos.lerp(other.pos, frac);
		this.vel.lerp(other.vel, frac);
		this.dir.lerp(other.dir, frac);
		this.halfExtents.lerp(other.halfExtents, frac);
		this.centerOffset.lerp(other.centerOffset, frac);
	}
}

});