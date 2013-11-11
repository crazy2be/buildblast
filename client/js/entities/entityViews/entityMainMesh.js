define(function(require) {
	var THREE = require("THREE");
	var PLAYER = require("player/playerSize");
	
	return function EntityMainMesh(entity) {
		var self = this;
		
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
		
		self.update = function(dt, playerPos) {
			setLook(entity.look(), playerPos);
			updatePos(entity.pos());
			
			headMat.color.setHex(0xffffff);
			bodyParts.needsUpdate = true;
			
			// Jump animation
			var dy = entity.dy();
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
		};
		
		self.mesh = function() {
			return bodyParts;
		};
		
		function setLook(newLook) {
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
		}
		
		function updatePos(pos, playerPos) {
			var co = PLAYER.CENTER_OFFSET;
			var c = new THREE.Vector3(
				pos.x + co.x,
				pos.y + co.y,
				pos.z + co.z
			);

			var velocity = entity.getVelocity();

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
			var he = PLAYER.HALF_EXTENTS;
			var hitboxGeometry = new THREE.CubeGeometry(he.x*2, he.y*2, he.z*2);
			var hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
			return hitboxMesh;
		}

		var headMat;
		function createHead() {
			headMat = new THREE.MeshNormalMaterial({
				color: 0x0000ff,
				transparent: true
			});
			var faceMat = new THREE.MeshNormalMaterial({
				color: 0x00ff00,
				transparent: true
			});
			
			if(localStorage.thirdPerson) {
				headMat.opacity = 0.3;
				faceMat.opacity = 0.3;
			}
		
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
	}
});