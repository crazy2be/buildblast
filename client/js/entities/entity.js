function Entity(id) {
	var self = this;

	var pos;
	var bodyParts = new THREE.Object3D();

	var material = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		wireframe: true
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

	var hitboxGeometry = new THREE.CubeGeometry(he.x*2, he.y*2, he.z*2);
	var hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
	//bodyParts.add(hitboxMesh);

	var bodyGeometry = new THREE.CubeGeometry(0.6, 1.3, 0.4);
	var bodyMesh = new THREE.Mesh(bodyGeometry, material);
	bodyMesh.position.y = -(ph - pbh) / 2;
	bodyParts.add(bodyMesh);

	var headGeometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
	headGeometry.materials = [material, faceMat];
	headGeometry.faces[0].materialIndex = 0;
	headGeometry.faces[1].materialIndex = 0;
	headGeometry.faces[2].materialIndex = 0;
	headGeometry.faces[3].materialIndex = 0;
	headGeometry.faces[4].materialIndex = 1;
	headGeometry.faces[5].materialIndex = 0;
	var headMesh = new THREE.Mesh(headGeometry, new THREE.MeshFaceMaterial(headGeometry.materials));
	headMesh.position.y = pbh / 2;
	bodyParts.add(headMesh);

	// Create an arm
	var leftArmGeo = new THREE.CubeGeometry(0.2, 0.6, 0.2);
	var leftArmMesh = new THREE.Mesh(leftArmGeo, armMat);
	leftArmMesh.position.y = -0.3;

	var leftArm = new THREE.Object3D();
	leftArm.add(leftArmMesh);
	leftArm.position.x = 0.4;
	leftArm.position.y = -(ph - pbh) / 2 + pbh / 2;
	bodyParts.add(leftArm);

	var rightArmGeo = new THREE.CubeGeometry(0.2, 0.6, 0.2);
	var rightArmMesh = new THREE.Mesh(leftArmGeo, armMat);
	rightArmMesh.position.y = -0.3;

	var rightArm = new THREE.Object3D();
	rightArm.add(rightArmMesh);
	rightArm.position.x = -0.4;
	rightArm.position.y = -(ph - pbh) / 2 + pbh / 2;
	bodyParts.add(rightArm);

	self.update = function (dt) {
		
	}

	self.setPos = function (newPos) {
		pos = newPos;
		var c = new THREE.Vector3(
			pos.x + co.x,
			pos.y + co.y,
			pos.z + co.z
		);
		bodyParts.position.set(c.x, c.y, c.z);
		return self;
	};

	self.contains = function (x, y, z) {
		if (!pos) return;
		var box = new Box(pos, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);
		return box.contains(x, y, z);
	};

	self.setRot = function (newRot) {
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

