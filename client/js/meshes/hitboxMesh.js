define(function(require) {

var THREE = require("THREE");

return function HitboxMesh(halfExtents) {
	var self = this;

	var material = new THREE.MeshBasicMaterial({
		color: 0x000000,
		wireframe: true
	});

	var geometry = new THREE.BoxGeometry(
			halfExtents.x * 2,
			halfExtents.y * 2,
			halfExtents.z * 2);
	var mesh = new THREE.Mesh(geometry, material);

	self.equals = function(other) {
		return halfExtents.x === other.x && halfExtents.y === other.y && halfExtents.z === other.z;
	};

	self.mesh = function () {
		return mesh;
	};

	self.update = function () {
	};
}

});
