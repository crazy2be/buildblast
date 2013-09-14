function World(scene, conn, camera, clientID) {
	var self = this;

	var chunkManager = new ChunkManager(scene, clientID);
	var entityManager = new EntityManager(scene, conn, camera);
	self.getEntityInfos = entityManager.getEntityInfos;

	window.testExposure.chunkManager = chunkManager;
	window.testExposure.entityManager = entityManager;

	conn.on('debug-ray', processRay);

	function processRay(payload) {
		var pos = new THREE.Vector3(payload.Pos.X, payload.Pos.Y, payload.Pos.Z);
		self.addSmallCube(pos);
	}

	self.update = function (dt, playerPos) {
		chunkManager.update(dt, playerPos);
	};

	var smallCube = new THREE.CubeGeometry(0.1, 0.1, 0.1);
	var smallCubeMat = new THREE.MeshNormalMaterial();
	self.addSmallCube = function (position) {
		if (!position) throw "Position required!";
		var cube = new THREE.Mesh( smallCube, smallCubeMat );
		cube.position = position;
		scene.add(cube);
	};

	self.addToScene = function (mesh) {
		scene.add(mesh);
	};

	self.removeFromScene = function (mesh) {
		scene.remove(mesh);
	};

	self.blockAt = function (wcX, wcY, wcZ) {
		var cords = worldToChunk(wcX, wcY, wcZ);
		var oc = cords.o;
		var cc = cords.c;

		var chunk = chunkManager.chunk(cc);
		if (!chunk) return null;
		var block = chunk.block(oc);
		if (!block) throw "Could not load blockkk!!!";
		else return block;
	};

	function findIntersection(point, look, criteriaFnc, precision, maxDist) {
		precision = precision || 0.01;
		maxDist = maxDist || 100;

		point = point.clone();

		look = look.clone();
		look.setLength(precision);

		for (var dist = 0; dist < maxDist; dist += precision) {
			point.add(look);
			var collision = criteriaFnc(point.x, point.y, point.z);
			if (collision) {
				return {
					point: point,
					dist: dist,
					item: collision,
				};
			}
		}
	}

	self.findPlayerIntersection = function (camera, precision) {
		function entityAt(wcX, wcY, wcZ) {
			return entityManager.entityAt(wcX, wcY, wcZ);
		}
		return findIntersection(camera.position, getLookedAtDirection(camera), entityAt, precision);
	};

	var projector = new THREE.Projector();
	function getLookedAtDirection(camera) {
		var look = new THREE.Vector3(0, 0, 1);
		// http://myweb.lmu.edu/dondi/share/cg/unproject-explained.pdf
		projector.unprojectVector(look, camera);
		return look.sub(camera.position);
	}

	// Traces a vector from the camera's position, along the look vector,
	// until hitting a solid block. If dontWantSolidBlock is true, it then
	// backs up one step, until the block immediately before the solid
	// block. Returns the position of the block.
	// BUG(yeerkkiller1): (literal) corner case is not handled correctly: 
	// http://awwapp.com/s/e3/4f/fe.png
	self.findLookedAtBlock = function(camera, dontWantSolidBlock) {
		var precision = 0.1;
		var pos = camera.position;
		var dir = getLookedAtDirection(camera);

		function solidBlockAt(wcX, wcY, wcZ) {
			var block = self.blockAt(wcX, wcY, wcZ);
			return block && block.solid();
		}
		
		var intersect = findIntersection(pos, dir, solidBlockAt, precision);
		if (!intersect) {
			console.log("You aren't looking at anything!");
			return;
		}

		if (dontWantSolidBlock) {
			//We backup to the last point, so should be the block directly before a solid.
			var cameraDirection = dir.setLength(precision);
			intersect.point.sub(cameraDirection);
		}

		return intersect.point;
	};

	self.changeBlock = function(wcX, wcY, wcZ, newType) {
		conn.queue('block', {
			Pos: {
				X: Math.floor(wcX),
				Y: Math.floor(wcY),
				Z: Math.floor(wcZ),
			},
			Type: newType,
		});
		chunkManager.queueBlockChange(wcX, wcY, wcZ, newType);
	}
}