function ChunkManager(scene, clientID) {
	var self = this;

	var chunks = {};
	var geometryWorker = new Worker('js/chunks/worker.js');
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

	geometryWorker.onmessage = function (e) {
		var kind = e.data.kind;
		var payload = e.data.payload;
		if (kind === 'chunk') {
			processChunk(payload);
		} else if (kind === 'show-chunk') {
			processShowChunk(payload);
		} else if (kind === 'hide-chunk') {
			processHideChunk(payload);
		} else if (kind === 'chunk-quality-change') {
			processQualityChange(payload);
		} else if (kind === 'log') {
			var args = ["Geometry worker:"].concat(payload.message);
			console[payload.type || 'log'].apply(console, args);
		}
	};

	geometryWorker.onerror = fatalError;

	function startChunkConn(name) {
		geometryWorker.postMessage({
			'kind': 'start-conn',
			'payload': {
				'uri': getWSURI('chunk/' + name),
			},
		});
	}

	function processChunk(payload) {
		var pg = payload.geometries;
		var geometries = [];
		for (var i = 0; i < pg.length; i++) {
			var geometry = new THREE.BufferGeometry();
			geometry.attributes = pg[i].attributes;
			geometry.offsets = pg[i].offsets;
			geometries.push(geometry);
		}

		var cc = payload.ccpos;

		var chunk = self.chunk(cc);
		if (chunk) chunk.remove();

		chunk = new Chunk(payload.blocks, geometries, scene, payload.quality);
		chunk.add();
		chunks[ccStr(cc)] = chunk;

		console.log("Added chunk at ", cc);
	}

	function processQualityChange(payload) {
		var chunk = self.chunk(payload.ccpos);
		if (!chunk) {
			console.warn("Got qred change command for chunk that is not loaded. Likely server bug.");
			return;
		}

		chunk.setQuality(payload.quality);
	}
}
