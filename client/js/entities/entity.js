function Entity(id) {
	var self = this;

	var pos;
	var vy;
	var isMoving = false;
	var bodyParts = new THREE.Object3D();

	var material = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		wireframe: true
	});
	var headMat = new THREE.MeshBasicMaterial({
		color: 0x0000ff
	});
	var faceMat = new THREE.MeshBasicMaterial({
		color: 0x00ff00
	});
	var hitboxMaterial = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true
	});
	var armMat = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true
	});

	var he = PLAYER_HALF_EXTENTS;
	var co = PLAYER_CENTER_OFFSET;
	var ph = PLAYER_HEIGHT;
	var pbh = PLAYER_BODY_HEIGHT;
	var peh = PLAYER_EYE_HEIGHT;

	var hitboxGeometry = new THREE.CubeGeometry(he.x*2, he.y*2, he.z*2);
	var hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
	//bodyParts.add(hitboxMesh);

	function createHead() {
		var geometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
		geometry.materials = [headMat, faceMat];
		geometry.faces[0].materialIndex = 0;
		geometry.faces[1].materialIndex = 0;
		geometry.faces[2].materialIndex = 0;
		geometry.faces[3].materialIndex = 0;
		geometry.faces[4].materialIndex = 1;
		geometry.faces[5].materialIndex = 0;
		var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(geometry.materials));
		mesh.position.y = peh - pbh / 2;
		return mesh;
	}

	function createBody() {
		var geometry = new THREE.CubeGeometry(0.6, pbh, 0.4);
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = 0;
		return mesh;
	}

	function createArm(offset) {
		var geometry = new THREE.CubeGeometry(0.2, 0.6, 0.2);
		var mesh = new THREE.Mesh(geometry, armMat);
		mesh.position.y = -0.3;

		var arm = new THREE.Object3D();
		arm.add(mesh);
		arm.position.x = offset * 0.4;
		arm.position.y = pbh / 2;
		return arm;
	}

	var headMesh = createHead();
	bodyParts.add(headMesh);
	var bodyMesh = createBody();
	bodyParts.add(bodyMesh);
	var leftArm = createArm(1);
	bodyParts.add(leftArm);
	var rightArm = createArm(-1);
	bodyParts.add(rightArm);

	var totalTime = 0;
	var armAngle = 0;
	var maxAngle = 4 * Math.PI / 5;
	self.update = function (dt) {
		if (vy > 0) {
			if (armAngle < maxAngle) {
				armAngle += (dt / 300) * maxAngle;
			}
		} else {
			if (armAngle < 0) {
				armAngle = 0;
			} else if (armAngle > 0) {
				armAngle -= (dt / 300) * maxAngle;
			}
		}
		rightArm.rotation.z = -armAngle;
		leftArm.rotation.z = armAngle;

		if (!isMoving) return;
		totalTime += dt;
		var angle = (Math.PI / 2) * sin(totalTime / 1000 * 2*Math.PI)
		if (angle > -0.1 && angle < 0.1) {
			isMoving = false;
			totalTime = 0;
			angle = 0;
		}
		rightArm.rotation.x = angle;
		leftArm.rotation.x = -1 * angle;
	}

	self.setVy = function (newVy) {
		vy = newVy;
	};

	self.setPos = function (newPos) {
		pos = newPos;
		var c = new THREE.Vector3(
			pos.x + co.x,
			pos.y + co.y,
			pos.z + co.z
		);

		var diffX = bodyParts.position.x - c.x;
		var diffZ = bodyParts.position.z - c.z;
		if (diffX !== 0 || diffZ !== 0) isMoving = true;

		bodyParts.position.set(c.x, c.y, c.z);

		return self;
	};

	self.contains = function (x, y, z) {
		if (!pos) return;
		var box = new Box(pos, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);
		return box.contains(x, y, z);
	};

	self.setLook = function (newRot) {
		function lookAt(obj, x, y, z) {
			var headTarget = new THREE.Vector3(
				obj.position.x + x,
				obj.position.y + y,
				obj.position.z + z
			);
			obj.lookAt(headTarget);
		}
		lookAt(bodyParts, newRot.x, 0, newRot.z);
		lookAt(headMesh, 0, newRot.y, 1);
	};

	self.addTo = function (scene) {
		scene.add(bodyParts);
	};

	self.removeFrom = function (scene) {
		scene.remove(bodyParts);
	};

	self.id = function () {
		return id;
	};
}
