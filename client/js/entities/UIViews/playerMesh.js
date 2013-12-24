define(function (require) {

var THREE = require("THREE");

var PLAYER = {};
PLAYER.HEIGHT = 1.75;
PLAYER.EYE_HEIGHT = 1.6;
PLAYER.BODY_HEIGHT = 1.3;

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

var ARM_LEFT = -1;
var ARM_RIGHT = 1;
function Arm(offset) {
	var self = this;

	var material = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true
	});
	var geometry = new THREE.CubeGeometry(0.2, 0.6, 0.2);
	var innerMesh = new THREE.Mesh(geometry, material);
	innerMesh.position.y = -0.3;

	var mesh = new THREE.Object3D();
	mesh.add(innerMesh);
	mesh.position.x = offset * 0.4;
	mesh.position.y = PLAYER.BODY_HEIGHT / 2;

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
	var geometry = new THREE.CubeGeometry(0.6, PLAYER.BODY_HEIGHT, 0.4);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = 0;

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

	var geometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
	geometry.faces[0].materialIndex = 0;
	geometry.faces[1].materialIndex = 0;
	geometry.faces[2].materialIndex = 0;
	geometry.faces[3].materialIndex = 0;
	geometry.faces[4].materialIndex = 1;
	geometry.faces[5].materialIndex = 0;

	var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([headMat, headMat, headMat, headMat, faceMat, headMat]));

	var peh = PLAYER.EYE_HEIGHT;
	var pbh = PLAYER.BODY_HEIGHT;
	mesh.position.y = peh - pbh / 2;

	self.mesh = function () {
		return mesh;
	}

	self.update = function (entity, clock) {
		var look = entity.look();
		faceToward(mesh, vec(0, look.y, 1));
	}
};

return function PlayerMesh() {
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
});
