define(function (require) {

var THREE = require("THREE");
var PLAYER = require("player/playerSize");

return function PlayerMesh() {
	var self = this;

	var headMesh = createHead();
	var bodyMesh = createBody();
	var leftArm = createArm(1);
	var rightArm = createArm(-1);

	var jumpAngle = 0;
	var maxJumpAngle = 4 * Math.PI / 5;
	var jumpSpeed = maxJumpAngle / 300;

	var isMoving = false;
	var vy = 0;

	var swingAngle = 0;
	var maxSwingAngle = Math.PI / 2;
	var swingSpeed = 2 * Math.PI / 1000;
	var totalSwingTime = 0;

	self.update = function (entity, clock) {
		updatePosition(entity.pos());
		updateLook(entity.look());
		vy = entity.vy();
		health = entity.health();

		var dt = clock.dt();

		// Jump animation
		jumpAngle = clamp(jumpAngle + signum(vy) * dt * jumpSpeed, 0, maxJumpAngle);
		leftArm.rotation.z = jumpAngle;
		rightArm.rotation.z = -jumpAngle;

		// Arm swinging animation (as you walk)
		if (!isMoving) return;
		totalSwingTime += dt;
		var swingAngle = maxSwingAngle * sin(totalSwingTime * swingSpeed)
		if (swingAngle > -0.1 && swingAngle < 0.1) {
			isMoving = false;
			swingAngle = 0;
		}
		leftArm.rotation.x = -swingAngle;
		rightArm.rotation.x = swingAngle;
	};

	var previousPos = new THREE.Vector3(0, 0, 0);
	function updatePosition(newPos) {
		var diffX = previousPos.x - newPos.x;
		var diffZ = previousPos.z - newPos.z;
		if (abs(diffX) > 0.01 || abs(diffZ) > 0.01) {
			isMoving = true;
		}
		previousPos = newPos;
	};

	function updateLook(newLook) {
		function lookAt(obj, pos, x, y, z) {
			var target = new THREE.Vector3(
				pos.x + x,
				pos.y + y,
				pos.z + z
			);
			obj.lookAt(target);
		}
		lookAt(headMesh, headMesh.position, 0, newLook.y, 1);
	};

	// Model/geometry
	function createHitbox() {
		var hitboxMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true
		});
		var he = PLAYER.HALF_EXTENTS;
		var hitboxGeometry = new THREE.CubeGeometry(he.x * 2, he.y * 2, he.z * 2);
		var hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
		return hitboxMesh;
	}

	function createHead() {
		var headMat = new THREE.MeshBasicMaterial({
			color: 0x0000ff
		});
		var faceMat = new THREE.MeshBasicMaterial({
			color: 0x00ff00
		});

		var geometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
		geometry.materials = [headMat, faceMat];
		geometry.faces[0].materialIndex = 0;
		geometry.faces[1].materialIndex = 0;
		geometry.faces[2].materialIndex = 0;
		geometry.faces[3].materialIndex = 0;
		geometry.faces[4].materialIndex = 1;
		geometry.faces[5].materialIndex = 0;

		var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(geometry.materials));

		var peh = PLAYER.EYE_HEIGHT;
		var pbh = PLAYER.BODY_HEIGHT;
		mesh.position.y = peh - pbh / 2;

		return mesh;
	}

	function createBody() {
		var material = new THREE.MeshBasicMaterial({
			color: 0x0000ff,
			wireframe: true
		});
		var geometry = new THREE.CubeGeometry(0.6, PLAYER.BODY_HEIGHT, 0.4);
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = 0;
		return mesh;
	}

	function createArm(offset) {
		var armMat = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true
		});
		var geometry = new THREE.CubeGeometry(0.2, 0.6, 0.2);
		var mesh = new THREE.Mesh(geometry, armMat);
		mesh.position.y = -0.3;

		var arm = new THREE.Object3D();
		arm.add(mesh);
		arm.position.x = offset * 0.4;
		arm.position.y = PLAYER.BODY_HEIGHT / 2;
		return arm;
	}

	self.meshes = function () {
		return [headMesh, bodyMesh, leftArm, rightArm];
	};
}
});