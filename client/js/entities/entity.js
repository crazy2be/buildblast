function BetterHistoryBuffer() {
	var self = this;
	var times = [];
	var datums = [];
	var len = 0;
	self.add = function (t, data) {
		if (t < times[len - 1]) {
			console.warn("Not adding old data to history buffer.")
		}
		times.push(t);
		datums.push(data);
		len++;
		if (len > 100) {
			times.shift();
			datums.shift();
			len--;
		}
	};
	function lerp(a, b, frac) {
		if (typeof a === 'number') {
			return a*(1 - frac) + b*frac;
		} else if (typeof a === 'object') {
			var res = {};
			for (var key in a) {
				if (!a.hasOwnProperty(a)) continue;
				res[key] = lerp(a[key], b[key], frac);
			}
			return res;
		} else {
			throw "I don't know how to lerp that: " + a;
		}
	}
	self.at = function (t) /* data */ {
		var newest_t = times[len - 1];
		if (newest_t <= t) {
			return datums[len - 1];
		}
		
		var oldest_t = times[0];
		if (oldest_t >= t) {
			return datums[0];
		}
		
		var older_i = len - 1;
		var newer_i = len - 1;
		for (var i = 1; i < len; i++) {
			older_i = i;
			if (times[older_i] <= t) break;
			newer_i = older_i;
		}
		if (times[older_i] === t) {
			return datums[older_i];
		}
		return lerp(
			datums[older_i],
			datums[newer_i],
			(t - times[older_i])/(times[newer_i] - times[older_i]));
	};
}
function NetworkEntityController(entity, clock) {
	var self = this;
	var history = new BetterHistoryBuffer();
	
	self.update = function () {
		entity.update(history.at(clock.time()), clock);
	};
	
	self.message = function (data) {
		history.add(data.time, data.data);
	};
}
function PredictiveEntityController(entity, clock, controls, predictor) {

	var self = this;
	var controlStates = [];
	var times = [];
	var lastConfirmed = {
		time: 0,
		data: {
			pos: new THREE.DVector3(0, 0, 0),
			look: new THREE.DVector3(0, 0, 0),
			vy: 0.0,
		},
	};
	
	self.update = function () {
		var latest = predictMovement();
		entity.update(latest, clock);
	};
	
	self.message = function (data) {
		// FUUUUU QUENTIN I WILL FIND YOU
		if (data.time === 0) return;
		if (times.length < 1) throw "No matching prediction data for given prediction.";
		var time = times.shift();
		var state = controlStates.shift();
		if (time != data.time) {
			return self.message(data);
			// TODO: Handle this more gracefully.
			throw "Recieved player-position packet from server with timestamp that does not match our oldest non-confirmed packet. This means the server is either processing packets out of order, or dropped one.";
		}

		lastConfirmed = data;
	};
	
	function predictMovement() {
		var c = controls.sample();
		var t = clock.time();
		controlStates.push(c);
		times.push(t);
		
		// TODO: Optimize this.
		return predictAll(t)
	}
	
	function predictAll(t) {
		var prev_t = lastConfirmed.time;
		var state = lastConfirmed.data;
		for (var i = 0; i < controlStates.length; i++) {
			var c = controlStates[i];
			var t = times[i];
			var dt = t - prev_t;
			state = predictor(state, c, dt);
		}
		return state;
	}
}
function PlayerEntity() {
	var self = this;

	var pos = new THREE.Vector3(0, 0, 0);
	var vy;
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
	self.update = function (state, clock) {
		self.setPos(state.pos);
		self.setLook(state.look);
		self.setVy(state.Vy);
		var dt = clock.dt();
		// Jump animation
		jumpAngle = clamp(jumpAngle + signum(vy)*dt*jumpSpeed, 0, maxJumpAngle);
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
	}

	self.setVy = function (newVy) {
		vy = newVy;
	};

	self.setPos = function (newPos) {
		pos = newPos;
		var co = PLAYER_CENTER_OFFSET;
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
	self.pos = function () { return pos };

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

	self.contains = function (x, y, z) {
		if (!pos) return;
		var box = new Box(pos, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);
		return box.contains(x, y, z);
	};

	self.addTo = function (scene) {
		scene.add(bodyParts);
	};

	self.removeFrom = function (scene) {
		scene.remove(bodyParts);
	};
	
	// Model/geometry
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