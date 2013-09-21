function Entity(id, world, clock) {
	var self = this;

	var rot = new THREE.Vector3(0, 0, 0);
	var hp = 0;

	var posBuffer = new EntityPrediction(world, clock, new THREE.Vector3(0, 0, 0));

	posBuffer.setDelay(100);

	self.predictMovement = posBuffer.predictMovement;
	self.posMessage = posBuffer.posMessage;
	self.pos = posBuffer.pos;
	self.contains = posBuffer.contains;
	self.setDelay = posBuffer.setDelay;
	self.lag = posBuffer.lag;

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
}