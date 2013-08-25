function ChunkManager(scene, clientID) {
	var self = this;

	var chunks = {};
	var geometryWorker = new Worker('js/chunks/worker/main.js');
	startChunkConn(clientID);

	self.chunk = function (cc) {
		return chunks[ccStr(cc)];
	};

	var accumulatedTime = 0;
	self.update = function (dt, playerPos) {
		accumulatedTime += dt;
		if (accumulatedTime < 1000 /*ms*/) return;

		accumulatedTime -= 1000;
		var p = playerPos;
		geometryWorker.postMessage({
			'kind': 'player-position',
			'payload': {
				'pos': {x: p.x, y: p.y, z: p.z},
			},
		});
	};

	self.queueBlockChange = function (wx, wy, wz, newType) {
		geometryWorker.postMessage({
			'kind': 'block-change',
			'payload': {
				'Pos': {X: wx, Y: wy, Z: wz},
				'Type': newType,
			}
		});
	};

	function startChunkConn(name) {
		geometryWorker.postMessage({
			'kind': 'start-conn',
			'payload': {
				'uri': getWSURI('chunk/' + name),
			},
		});
	}

	geometryWorker.onmessage = function (e) {
		var kind = e.data.kind;
		var payload = e.data.payload;
		if (kind === 'chunk') {
			processChunk(payload);
		} else if (kind === 'chunk-voxelization-change') {
			processVoxelizationChange(payload);
		} else if (kind === 'log') {
			var args = ["Geometry worker:"].concat(payload.message);
			console[payload.type || 'log'].apply(console, args);
		}
	};

	geometryWorker.onerror = fatalError;

	//Payload contains vertices creates by the mesher.
	function processChunk(payload) {
		var pg = payload.geometries;
		var geometries = [];
		//Geometry for each voxelization (as in, far away, medium, close, etc... we
		//'voxelize' cubes that are far away).
		for (var i = 0; i < pg.length; i++) {
			var geometry = new THREE.BufferGeometry();
			geometry.attributes = pg[i].attributes;
			geometry.offsets = pg[i].offsets;
			geometries.push(geometry);
		}

		var cc = payload.ccpos;

		var chunk = self.chunk(cc);
		if (chunk) chunk.remove();

		chunk = new Chunk(payload.blocks, geometries, scene, payload.voxelization);
		chunk.add();
		chunks[ccStr(cc)] = chunk;

		console.log("Added chunk at ", cc);
	}

	function processVoxelizationChange(payload) {
		var chunk = self.chunk(payload.ccpos);
		if (!chunk) {
			console.warn("Got qred change command for chunk that is not loaded. Likely server bug.");
			return;
		}

		chunk.setVoxelization(payload.voxelization);
	}
}