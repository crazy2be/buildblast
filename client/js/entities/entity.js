function Entity(id, world, clock) {
	var self = this;

	var rot = new THREE.Vector3(0, 0, 0);
	var hp = 0;

	var posBuffer = new PosPrediction(world, clock, new THREE.Vector3(0, 0, 0));

	//We forward a lot, as we are basically embedding posBuffer
	self.predictMovement = posBuffer.predictMovement;
	self.posMessage = posBuffer.posMessage;
	self.pos = posBuffer.pos;
	self.contains = posBuffer.contains;
	self.lag = posBuffer.lag;

	var _prediction = false;
	self.enablePrediction = function() {
		_prediction = true;
	};
	self.disablePrediction = function() {
		_prediction = false;
	};

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

	//TODO: Move body stuff into a plugin
	var bodyGeometry = new THREE.CubeGeometry(0.4, 1.3, 0.6);
	var bodyMesh = new THREE.Mesh(bodyGeometry, material);

	var headGeometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
	var headMesh = new THREE.Mesh(headGeometry, material);

	var UIPlugins = [];

	self.initPlugins = function() {
		UIPlugins.push(new HealthBar(self));
		if (localStorage.debug) {
			UIPlugins.push(new PosHistoryBar(self, posBuffer, clock));
		}

		return self;
	};

	self.setHealth = function(health) {
		hp = health;
	};

	self.health = function() {
		return hp;
	};

	self.maxHealth = function() {
		//TODO: Actually sync this with the server
		return 100;
	}

	self.addTo = function (scene) {
		scene.add(bodyMesh);
		scene.add(headMesh);
		scene.add(hitboxMesh);

		UIPlugins.forEach(function (plugin) {
			scene.add(plugin.mesh());
		});
	};

	self.removeFrom = function (scene) {
		scene.remove(bodyMesh);
		scene.remove(headMesh);
		scene.remove(hitboxMesh);

		UIPlugins.forEach(function (plugin) {
			scene.remove(plugin.mesh());
		});
	};

	self.id = function () {
		return id;
	};

	self.update = function(dt, playerPos) {
		if(_prediction) {
			posBuffer.setDelay(-1);
		} else {
			posBuffer.setDelay(world.curLagInduction());
		}

		UIPlugins.forEach(function (plugin) {
			plugin.update(playerPos);
		});

		updatePos(playerPos);
		updateRot();
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

		return self;
	}

	function updateRot() {
		headMesh.rotation.set(rot.x, rot.y, rot.z);
		var br = bodyMesh.rotation;
		br.y = rot.y;
	}
}