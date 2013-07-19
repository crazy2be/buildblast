function Entity(id) {
	var self = this;

	var pos;

	var material = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
	});
	var faceMat = new THREE.MeshBasicMaterial({
		color: 0x00ff00
	});
	var hitboxMaterial = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true,
	});

	var he = PLAYER_HALF_EXTENTS;
	var co = PLAYER_CENTER_OFFSET;
	var hitboxGeometry = new THREE.CubeGeometry(he.x*2, he.y*2, he.z*2);
	var hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);

	var bodyGeometry = new THREE.CubeGeometry(0.6, 1.3, 0.4);
	var bodyMesh = new THREE.Mesh(bodyGeometry, material);

	var headGeometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
	headGeometry.materials = [material, faceMat];
	headGeometry.faces[0].materialIndex = 0;
	headGeometry.faces[1].materialIndex = 0;
	headGeometry.faces[2].materialIndex = 0;
	headGeometry.faces[3].materialIndex = 0;
	headGeometry.faces[4].materialIndex = 1;
	headGeometry.faces[5].materialIndex = 0;
	var headMesh = new THREE.Mesh(headGeometry, new THREE.MeshFaceMaterial(headGeometry.materials));

	self.setPos = function (newPos) {
		pos = newPos;
		var c = new THREE.Vector3(
			pos.x + co.x,
			pos.y + co.y,
			pos.z + co.z
		);
		var h = PLAYER_HEIGHT;
		var bh = PLAYER_BODY_HEIGHT;
		bodyMesh.position.set(c.x, c.y - (h - bh)/2, c.z);
		headMesh.position.set(c.x, c.y + bh/2, c.z);
		hitboxMesh.position.set(c.x, c.y, c.z);
		return self;
	};

	self.contains = function (x, y, z) {
		if (!pos) return;
		var box = new Box(pos, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);
		return box.contains(x, y, z);
	};

	self.setRot = function (newRot) {
		var headTarget = new THREE.Vector3(
			headMesh.position.x + newRot.x,
			headMesh.position.y + newRot.y,
			headMesh.position.z + newRot.z
		);
		headMesh.lookAt(headTarget);
		var bodyTarget = new THREE.Vector3(
			bodyMesh.position.x + newRot.x,
			bodyMesh.position.y,
			bodyMesh.position.z + newRot.z
		);
		bodyMesh.lookAt(bodyTarget);
	};

	self.addTo = function (scene) {
		scene.add(bodyMesh);
		scene.add(headMesh);
		//scene.add(hitboxMesh);
	};

	self.removeFrom = function (scene) {
		scene.remove(bodyMesh);
		scene.remove(headMesh);
		//scene.remove(hitboxMesh);
	};

	self.id = function () {
		return id;
	};
}

