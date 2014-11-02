define(function (require) {

var THREE = require("THREE");
var Item = require("player/item");

function WorldItemMesh(kind, halfExtents) {
	var self = this;

	var mesh = new Item(kind).model();
	mesh.scale.set(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);

	self.mesh = function () {
		return mesh;
	};

	var oscillator = 0;
	self.update = function (entity, clock, camera) {
		var dt = clock.dt();
		oscillator += dt;
		mesh.rotation.y += 0.5 * 2*Math.PI * (dt / 1000);
		mesh.position.y = 0.18 * Math.sin(oscillator / 1000);
	}
}

function vec(x, y, z) {
	return new THREE.Vector3(x || 0, y || 0, z || 0);
}

return WorldItemMesh;

});
