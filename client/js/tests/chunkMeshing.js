//Causes the fake data to be created instead of live data (fake data is more consistent)
//localStorage.fakeData

function random(min, max) {
	return ~~(Math.random() * (max - min)) + min;
}

function logRandom(min, max) {
    //Skewed to low numbers, approximately exponential?
    var range = max - min;
    var maxRangeBit = Math.ceil(Math.log(range) / Math.log(2));
    var maxBit = ~~(consistentRandom() * (maxRangeBit + 1));

    var realRange = Math.min(pow(2, maxBit), range);

    return ~~(consistentRandom() * realRange + min);
}

//From http://en.wikipedia.org/wiki/Random_number_generation
var randomZ = 59825525;
var randomW = 239876364;
function seedRandom(z, w) {
    randomZ = z;
    randomW = w;
}
function consistentRandom() {
    //Might not entirely work with Javascipt Numbers
    randomZ = 36969 * (randomZ & 65535) + (randomZ >> 16);
    randomW = 18000 * (randomW & 65535) + (randomW >> 16);
    return (~~((randomZ << 16) + randomW) & (-(1 << 31) - 1)) / -(1 << 31);
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
	var cameraPos = window.testExposure.player.pos();

	var cords = worldToChunk(cameraPos.x, cameraPos.y, cameraPos.z);
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

	var rect3Count = 150;

	while (rect3Count-- > 0) {
	    var xs = logRandom(0, CHUNK_WIDTH);
	    var ys = logRandom(0, CHUNK_HEIGHT);
	    var zs = logRandom(0, CHUNK_DEPTH);

	    var dx = logRandom(0, CHUNK_WIDTH);
	    var dy = logRandom(0, CHUNK_HEIGHT);
	    var dz = logRandom(0, CHUNK_DEPTH);

	    dx = min(dx, CHUNK_WIDTH - xs);
	    dy = min(dy, CHUNK_WIDTH - ys);
	    dz = min(dz, CHUNK_WIDTH - zs);

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

function test_largeChunkMesh() {
	var manager = new WorkerChunkManager();

	function loadChunk(cc) {
		var chunk = manager.get(cc);
		chunk = new ChunkGeometry(cc,
			localStorage.fakeData ? generateRandomBlockGeometryArray() :
				getCurrentChunkBlockArray(), manager);
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

	var loops = 100;
	for (var i = 0; i < loops; i++) {
	    seedRandom(59825525, 239876364);
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