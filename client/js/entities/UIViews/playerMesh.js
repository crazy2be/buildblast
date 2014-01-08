define(function (require) {

var THREE = require("THREE");

// All of the random constant values in this file should
// be derived as this scale factor multiplied by the
// appropriate number from
// http://www.bubblews.com/news/482735-anthropometry
// This value should be the same as playerHeight in
// player.go, so that the bounding box matches up.
var scale = 1.75;

function PlayerMesh() {
	var self = this;

	var pieces = [
		new Arm(ARM_LEFT),
		new Arm(ARM_RIGHT),
		new Head(),
		new Body(),
	];

	var mesh = new THREE.Object3D();
	for (var i = 0; i < pieces.length; i++) {
		mesh.add(pieces[i].mesh());
	}
	mesh.position.y = -scale/2;

	self.mesh = function () {
		return mesh;
	}

	self.update = function (entity, clock) {
		var look = entity.look();
		faceToward(mesh, vec(look.x, 0, look.z));
		for (var i = 0; i < pieces.length; i++) {
			pieces[i].update(entity, clock);
		}
	}
}

var ARM_LEFT = -1;
var ARM_RIGHT = 1;
function Arm(offset) {
	var self = this;

	var material = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true
	});
	var thick = (0.870 - 0.818)*scale
	var unscaledLength = 0.186 + 0.146 + 0.108;
	var length = unscaledLength*scale;
	var geometry = new THREE.CubeGeometry(thick, length, thick);
	var innerMesh = new THREE.Mesh(geometry, material);
	// Move the pivot
	innerMesh.position.y = -length / 2;

	var mesh = new THREE.Object3D();
	mesh.add(innerMesh);
	mesh.position.x = offset * (0.129*scale + thick/2);
	mesh.position.y = 0.818*scale;

	self.mesh = function () {
		return mesh;
	}

	var jumpAngle = 0;
	var maxJumpAngle = 4 * Math.PI / 5;
	var jumpSpeed = maxJumpAngle / 300;

	var isMoving = false;
	var previousPos = vec(0, 0, 0);

	var swingAngle = 0;
	var maxSwingAngle = Math.PI / 2;
	var swingSpeed = 2 * Math.PI / 1000;
	var totalSwingTime = 0;
	self.update = function (entity, clock) {
		var dt = clock.dt();
		var vy = entity.vy();
		var newPos = entity.pos();

		var diffX = previousPos.x - newPos.x;
		var diffZ = previousPos.z - newPos.z;
		if (abs(diffX) > 0.01 || abs(diffZ) > 0.01) {
			isMoving = true;
		}
		previousPos = newPos;

		// Jump animation
		jumpAngle = clamp(jumpAngle + signum(vy) * dt * jumpSpeed, 0, maxJumpAngle);
		mesh.rotation.z = offset * jumpAngle;

		// Arm swinging animation (as you walk)
		if (!isMoving) return;
		totalSwingTime += dt;
		var swingAngle = maxSwingAngle * sin(totalSwingTime * swingSpeed)
		if (swingAngle > -0.1 && swingAngle < 0.1) {
			isMoving = false;
			swingAngle = 0;
		}
		mesh.rotation.x = offset * swingAngle;
	}
};

function Body() {
	var self = this;

	var material = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		wireframe: true
	});
	var geometry = new THREE.CubeGeometry(0.259*scale, 0.818*scale, 0.107*scale);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = 0.818*scale / 2;

	self.mesh = function () {
		return mesh;
	};

	self.update = function (entity, clock) {};
};

function Head() {
	var self = this;

	var headMat = new THREE.MeshBasicMaterial({
		color: 0x0000ff
	});
	var faceMat = new THREE.MeshBasicMaterial({
		color: 0x00ff00
	});

	var s = 0.130 * scale;
	var geometry = new THREE.CubeGeometry(s, s, s);
	geometry.faces[0].materialIndex = 0;
	geometry.faces[1].materialIndex = 0;
	geometry.faces[2].materialIndex = 0;
	geometry.faces[3].materialIndex = 0;
	geometry.faces[4].materialIndex = 1;
	geometry.faces[5].materialIndex = 0;

	var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([headMat, headMat, headMat, headMat, faceMat, headMat]));

	mesh.position.y = 0.936 * scale;

	self.mesh = function () {
		return mesh;
	}

	self.update = function (entity, clock) {
		var look = entity.look();
		faceToward(mesh, vec(0, look.y, 1));
	}
};

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

return PlayerMesh;
});
