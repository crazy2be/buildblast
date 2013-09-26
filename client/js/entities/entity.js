function Entity(id, world, clock, scene) {
	var self = this;

	var rot = new THREE.Vector3(0, 0, 0);
	var hp = 0;

	var posBuffer = new PosPrediction(world, clock, new THREE.Vector3(0, 0, 0));
	posBuffer.setUseEntityTime(true);
	var _isLagCompensated = true;

	//We forward a lot, as we are basically embedding posBuffer
	self.predictMovement = posBuffer.predictMovement;
	self.posMessage = posBuffer.posMessage;
	self.pos = posBuffer.pos;
	self.contains = posBuffer.contains;
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

	//QTODO: Move body stuff into a view
	var isMoving = false;
	
	var bodyParts = new THREE.Object3D();
	var headMesh = createHead();
	bodyParts.add(headMesh);
	var bodyMesh = createBody();
	bodyParts.add(bodyMesh);
	var leftArm = createArm(1);
	bodyParts.add(leftArm);
	var rightArm = createArm(-1);
	bodyParts.add(rightArm);

	var jumpAngle = 0;
	var maxJumpAngle = 4 * Math.PI / 5;
	var jumpSpeed = maxJumpAngle / 300;
	
	var swingAngle = 0;
	var maxSwingAngle = Math.PI / 2;
	var swingSpeed = 2 * Math.PI / 1000;
	var totalSwingTime = 0;


	var UIViews = [];

	self.initViews = function() {
		if (localStorage.posHistoryBar) {
			UIViews.push(new PosHistoryBar(self, posBuffer, clock));
		}

		return self;
	};

	self.lagInduce = function(yes) {
		_isLagCompensated = yes;
		posBuffer.setUseEntityTime(_isLagCompensated);
	}
	self.isLagCompensated = function() {
		return _isLagCompensated;
	}
	
	self.setViewVisibility = function(visible) {
		if(!visible) {
			self.removeFromScene();
		} else {
			self.addToScene();
		}
	}

	self.setHealth = function(health) {
		hp = health;
	};

	self.health = function() {
		return hp;
	};

	self.maxHealth = function() {
		//QTODO: Actually sync this with the server
		return 100;
	}

	self.addToScene = function () {
		scene.add(bodyParts);

		UIViews.forEach(function (view) {
			scene.add(view.mesh());
		});
	};

	self.removeFromScene = function () {
		scene.remove(bodyParts);

		UIViews.forEach(function (view) {
			scene.remove(view.mesh());
		});
	};

	self.id = function () {
		return id;
	};

	self.update = function(dt, playerPos) {
		UIViews.forEach(function (view) {
			view.update(playerPos);
		});

		var look = self.pos().look;
		if(look) {
			self.setLook(look);
		}

		// Jump animation
		var dy = self.pos().dy || 0;
		jumpAngle = clamp(jumpAngle + signum(dy)*dt*jumpSpeed, 0, maxJumpAngle);
		leftArm.rotation.z = jumpAngle;
		rightArm.rotation.z = -jumpAngle;

		// Arm swinging animation (as you walk)
		if (isMoving) {
			totalSwingTime += dt;
			var swingAngle = maxSwingAngle * sin(totalSwingTime * swingSpeed)
			if (swingAngle > -0.1 && swingAngle < 0.1) {
				isMoving = false;
				swingAngle = 0;
			}
			leftArm.rotation.x = -swingAngle;
			rightArm.rotation.x = swingAngle;
		}

		updatePos(playerPos);
	};

	self.setLook = function (newLook) {
		function lookAt(obj, x, y, z) {
			var headTarget = new THREE.Vector3(
				obj.position.x + x,
				obj.position.y + y,
				obj.position.z + z
			);
			obj.lookAt(headTarget);
		}
		lookAt(bodyParts, newLook.x, 0, newLook.z);
		lookAt(headMesh, 0, newLook.y, 1);
	};

	function updatePos(playerPos) {
		var pos = self.pos();
		var co = PLAYER_CENTER_OFFSET;
		var c = new THREE.Vector3(
			pos.x + co.x,
			pos.y + co.y,
			pos.z + co.z
		);

		var velocity = posBuffer.getVelocity();

		if(velocity.x !== 0 || velocity.z !== 0) {
			isMoving = true;
		}

		bodyParts.position.set(c.x, c.y, c.z);
	}

	function createHitbox() {
		var hitboxMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true
		});
		var he = PLAYER_HALF_EXTENTS;
		var hitboxGeometry = new THREE.CubeGeometry(he.x*2, he.y*2, he.z*2);
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
		
		var peh = PLAYER_EYE_HEIGHT;
		var pbh = PLAYER_BODY_HEIGHT;
		mesh.position.y = peh - pbh / 2;
		
		return mesh;
	}

	function createBody() {
		var material = new THREE.MeshBasicMaterial({
			color: 0x0000ff,
			wireframe: true
		});
		var geometry = new THREE.CubeGeometry(0.6, PLAYER_BODY_HEIGHT, 0.4);
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
		arm.position.y = PLAYER_BODY_HEIGHT / 2;
		return arm;
	}
	
	// Utils
	// Clamp n between [a, b]. Behaviour is
	// undefined if a > b.
	function clamp(n, a, b) {
		return n < a ? a : n > b ? b : n;
	}
	// Return the sign of n, -1, 1, or 0.
	function signum(n) {
		return n < 0 ? -1 : n > 0 ? 1 : 0;
	}
}