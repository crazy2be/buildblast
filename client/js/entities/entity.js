function Entity(id, world) {
	var self = this;

	var rot = new THREE.Vector3(0, 0, 0);
	var hp = 0;

	var moveSim = window.moveSim();
	var box = new Box(PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);
	var posBuffer = new PredictionBuffer(
		moveSim.simulateMovement.bind(null, {
			collides: box.collides,
			world: world
		})
	);
	posBuffer.addConfirmed(0, new THREE.Vector3(0, 0, 0));

	var material = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		wireframe: true,
	});
	var hitboxMaterial = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true,
	});

	var he = PLAYER_HALF_EXTENTS;
	var co = PLAYER_CENTER_OFFSET;
	var hitboxGeometry = new THREE.CubeGeometry(he.x*2, he.y*2, he.z*2);
	var hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);

	var bodyGeometry = new THREE.CubeGeometry(0.4, 1.3, 0.6);
	var bodyMesh = new THREE.Mesh(bodyGeometry, material);

	var headGeometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
	var headMesh = new THREE.Mesh(headGeometry, material);

	var healthBar;

	self.init = function() {
		healthBar = new HealthBar(self);

		return self;
	}

	self.update = function(dt, playerPos) {
		updatePos(playerPos);
		updateRot();
		updateHP(playerPos);
	};

	function updatePos(playerPos) {
		var pos = self.pos();
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

		healthBar.updatePos(pos, playerPos);

		return self;
	}

	function updateRot() {
		headMesh.rotation.set(rot.x, rot.y, rot.z);
		var br = bodyMesh.rotation;
		br.y = rot.y;
	}

	function updateHP(playerPos) {
		healthBar.updateHP(hp, playerPos);
	}

	self.posMessage = function(payload) {
		//TODO: Make the server just send us this structure,
		//or handle the server structure directly.
		var ray = {};
		ray.x = payload.Pos.X;
		ray.y = payload.Pos.Y;
		ray.z = payload.Pos.Z;
		ray.dy = payload.Vy;
		posBuffer.addConfirmed(payload.Timestamp, ray);

		var pos = posBuffer.getLastValue();

		//rot = makeVec3(tickData.Rot);
	}
	self.controlMessage = function(controlState) {
		posBuffer.addPrediction(controlState.Timestamp, controlState.Controls);
	}
	self.pos = function () {
		return posBuffer.getLastValue();
	}

	self.contains = function (x, y, z) {
		return pointCollides(
			new THREE.Vector3(x, y, z),
			box.boundingBox(self.pos())
		);
	};

	self.health = function() {
		return hp;
	};

	self.maxHealth = function() {
		return 100;
	}

	self.addTo = function (scene) {
		scene.add(bodyMesh);
		scene.add(headMesh);
		scene.add(hitboxMesh);
		scene.add(healthBar.mesh());
	};

	self.removeFrom = function (scene) {
		scene.remove(bodyMesh);
		scene.remove(headMesh);
		scene.remove(hitboxMesh);
		scene.remove(healthBar.mesh());
	};

	self.id = function () {
		return id;
	};
}