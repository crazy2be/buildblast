define(function(require) {

var THREE = require("THREE");

var size = 0.6;

function SlimeMesh() {
	var self = this;

	var headMat = new THREE.MeshBasicMaterial({
		color: 0x00ff00
	});
	var faceMat = new THREE.MeshBasicMaterial({
		color: 0x0000ff
	});

	var geometry = new THREE.CubeGeometry(size, size, size);
	geometry.faces[0].materialIndex = 0;
	geometry.faces[1].materialIndex = 0;
	geometry.faces[2].materialIndex = 0;
	geometry.faces[3].materialIndex = 0;
	geometry.faces[4].materialIndex = 1;
	geometry.faces[5].materialIndex = 0;

	var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(
			[headMat, headMat, headMat, headMat, faceMat, headMat]));

	self.mesh = function () {
		return mesh;
	};

	self.update = function (entity, clock) {
		var look = entity.look();
		faceToward(mesh, vec(0, look.y, 1));
	}
}

function vec(x, y, z) {
	return new THREE.Vector3(x || 0, y || 0, z || 0);
}

function faceToward(mesh, direction) {
	var target = vec(
		mesh.position.x + direction.x,
		mesh.position.y + direction.y,
		mesh.position.z + direction.z
	);
	mesh.lookAt(target);
}

return SlimeMesh;

});