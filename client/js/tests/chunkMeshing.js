function random(min, max) {
	return ~~(Math.random() * (max - min)) + min;
}

function generateRandomBlockArray() {
	var blocks = new Float32Array(CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH);

	LOOP.For3D(
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH),
		function (blockPos) {
			blocks[
				blockPos.x * CHUNK_WIDTH * CHUNK_HEIGHT +
				blockPos.y * CHUNK_WIDTH +
				blockPos.z
			] = random(1, 3);
		}
	);

	return blocks;
}

function getCurrentChunkBlockArray() {
	var playerCount = 0;
	var aPlayer = null;
	for (var player in testExposure.players) {
		aPlayer = player;
		playerCount++;
	}

	if (playerCount != 1) {
		console.warn("Multiple players, testing on chunk of first player: " + aPlayer);
	}

	var cameraPos = window.testExposure.players[aPlayer].camera.position.clone();

	var cords = worldToChunk(cameraPos[0], cameraPos[1], cameraPos[2]);
	var oc = cords.o;
	var cc = cords.c;

	var chunkManager = window.testExposure.chunkManager;
	var chunk = chunkManager.chunk(cc);
	return chunk.testExposure.blocks;
}

function generateRandomBlockGeometryArray() {
	var blocks = new Float32Array(CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH);

	//Generate random shapes
	//Rect3 = { start: Vector3, size: Vector3 };
	var Rect3s = [];

	var rect3Count = 60;

	while (rect3Count-- > 0) {
		var xs = random(0, CHUNK_WIDTH);
		var ys = random(0, CHUNK_HEIGHT);
		var zs = random(0, CHUNK_DEPTH);

		var dx = random(1, 6);
		var dy = random(1, 6);
		var dz = random(1, 6);
		Rect3s.push({ start: { x: xs, y: ys, z: zs }, size: { x:dx, y:dy, z:dz } });
	}

	//1 is air
	LOOP.For3D(
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH),
		function (blockPos) {
			blocks[
				blockPos.x * CHUNK_WIDTH * CHUNK_HEIGHT +
				blockPos.y * CHUNK_WIDTH +
				blockPos.z
			] = Block.AIR;
		}
	);

	for (var ix = 0; ix < Rect3s.length; ix++) {
		LOOP.For3D(Rect3s[ix].start, Rect3s[ix].size, function (blockPos) {
			blocks[
				blockPos.x * CHUNK_WIDTH * CHUNK_HEIGHT +
				blockPos.y * CHUNK_WIDTH +
				blockPos.z
			] = Block.DIRT;
		});
	}

	return blocks;
}

var testOnLiveData = false;

function test_largeChunkMesh() {
	var manager = new WorkerChunkManager();

	function loadChunk(cc) {
		var chunk = manager.get(cc);
		chunk = new ChunkGeometry(cc,
			testOnLiveData ? getCurrentChunkBlockArray() :
				generateRandomBlockGeometryArray(), manager);
		manager.set(cc, chunk);
	}

	var maxChunk = 1;

	function doTest(chunkMesher) {
		var totalVerts = 0;
		for (var ix = 0; ix < 1; ix++) {
			LOOP.For3D(
				new THREE.Vector3(0, 0, 0),
				new THREE.Vector3(maxChunk, maxChunk, maxChunk),
				function (chunkPos) {
					manager.get(chunkPos).chunkMesher = chunkMesher;
					var geometries = manager.get(chunkPos).calculateGeometries().geometries;
					for (var ig = 0; ig < geometries.length; ig++) {
						totalVerts += geometries[ig].attributes.position.numItems;
					}
				}
			);
		}
		return totalVerts;
	}

	var tests = [
		{ name: "greedyMesher" },
		{ name: "simpleMesh" },
		{ name: "simpleMesh2" }
	];

	var loops = 20;
	for (var i = 0; i < loops; i++) {
		LOOP.For3D(
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(maxChunk, maxChunk, maxChunk),
			function (chunkPos) {
				loadChunk(chunkPos);
			}
		);

		for (var ix = 0; ix < tests.length; ix++) {
			var time = new Date().getTime();

			if(loops == 1) console.profile(tests[ix].name);
			var verts = doTest(window[tests[ix].name]);
			if (loops == 1) console.profileEnd();

			time = new Date().getTime() - time;

			tests[ix].time = tests[ix].time || 0;
			tests[ix].time += time;

			tests[ix].verts = tests[ix].verts || 0;
			tests[ix].verts += verts;
		}
	}

	for (var ix = 0; ix < tests.length; ix++) {
		console.log(tests[ix].name + " time: " + tests[ix].time + " with: " + tests[ix].verts + " verts");
	}
}
