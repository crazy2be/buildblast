define(function (require) {

var THREE = require("THREE");

function WorldItemMesh(halfExtents) {
	var self = this;

	var geometry = new THREE.Geometry();

	var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xffffcc } );
	var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } );
	var multiMaterial = [ darkMaterial, wireframeMaterial ];

	var mesh = THREE.SceneUtils.createMultiMaterialObject(
		new THREE.OctahedronGeometry(halfExtents.x, 0),
		multiMaterial);

	self.mesh = function () {
		return mesh;
	};

	self.update = function (entity, clock, camera) {
		// TODO: Fanciness.
	}
}

function vec(x, y, z) {
	return new THREE.Vector3(x || 0, y || 0, z || 0);
}

return WorldItemMesh;

});
