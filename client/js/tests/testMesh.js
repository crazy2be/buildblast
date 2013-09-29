var testMesh = function () {
	var testMesh = {};

	function getCurrentChunkBlockArray() {
		var cameraPos = window.testExposure.player.pos();

		var cords = worldToChunk(cameraPos.x, cameraPos.y, cameraPos.z);
		var oc = cords.o;
		var cc = cords.c;

		var chunkManager = window.testExposure.chunkManager;
		var chunk = chunkManager.chunk(cc);
		return chunk.testExposure.blocks;
	}

	testMesh.large = function () {
		var manager = new WorkerChunkManager();

		function loadChunk(cc) {
			var chunk = manager.get(cc);

			if (localStorage.fakeData) {
				console.warn("Too much work, not faking the data");
			}

			chunk = new ChunkGeometry(cc, getCurrentChunkBlockArray(), manager);
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
			LOOP.For3D(
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(maxChunk, maxChunk, maxChunk),
			function (chunkPos) {
				loadChunk(chunkPos);
			}
		);

			for (var ix = 0; ix < tests.length; ix++) {
				var time = new Date().getTime();

				if (loops == 1) console.profile(tests[ix].name);
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

	return testMesh;
} ();