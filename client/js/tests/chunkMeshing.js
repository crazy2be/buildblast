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

function generateRandomBlockGeometryArray() {
    var blocks = new Float32Array(CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH);

    //Generate random shapes
    //Rect3 = { start: Vector3, size: Vector3 };
    var Rect3s = [];

    var rect3Count = 2;

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

function test_largeChunkMesh() {
    //Must reset the setting, their local settings should not impact the test,
    //instead any settings should be set in the test.
    settings = {};

    var manager = new WorkerChunkManager();

    function loadChunk(cc) {
        var chunk = manager.get(cc);
        chunk = new ChunkGeometry(cc, generateRandomBlockGeometryArray(), manager);
        manager.set(cc, chunk);
    }

    var maxChunk = 1;

    LOOP.For3D(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(maxChunk, maxChunk, maxChunk),
        function (chunkPos) {
            loadChunk(chunkPos);
        }
    );

    function doTest() {
        var totalVerts = 0;
        for (var ix = 0; ix < 3; ix++) {
            LOOP.For3D(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(maxChunk, maxChunk, maxChunk),
                function (chunkPos) {
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
        {name: "SimpleFast", number: 4},
        {name: "FastGreedy", number: 3},
        {name: "GreedyOld", number: 2},
        {name: "Greedy", number: 1},
        {name: "Simple", number: 0}
    ];

    for(var ix = 0; ix < tests.length; ix++) {
        var time = new Date().getTime();
        settings.greedyMesh = tests[ix].number;

        console.profile(tests[ix].name);
        var verts = doTest();
        console.profileEnd();

        time = new Date().getTime() - time;

        console.log(tests[ix].name + " time: " + time + " with: " + verts + " verts");
    }
}