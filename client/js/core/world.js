define(function(require) {

var ChunkManager = require("chunks/chunkManager");
var EntityManager = require("entities/entityManager");
var Block = require("chunks/block");
var Protocol = require("core/protocol");

var common = require("chunks/chunkCommon");

return function World(scene, conn, clientId, clock) {
	var self = this;

	var chunkManager = new ChunkManager(scene, clientId);
	var entityManager = new EntityManager(scene, conn, self, clock);

	self.setPlayer = entityManager.setPlayer;

	window.testExposure.chunkManager = chunkManager;
	window.testExposure.entityManager = entityManager;

	conn.on(Protocol.MSG_DEBUG_RAY, function(result) {
		self.addSmallCube(result.pos);
	});

	self.update = function (dt, playerPos) {
		entityManager.update(dt, playerPos);
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
		var cords = common.worldToChunk(wcX, wcY, wcZ);
		var oc = cords.o;
		var cc = cords.c;

		var chunk = chunkManager.chunk(cc);
		if (!chunk) return new Block(Block.NIL);
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
					item: collision
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
		var msgDataView = Protocol.marshalMessage(Protocol.MSG_BLOCK, [wcX, wcY, wcZ, newType]);
		conn.queueMessage(msgDataView);
		chunkManager.queueBlockChange(msgDataView);
	}
}
});
