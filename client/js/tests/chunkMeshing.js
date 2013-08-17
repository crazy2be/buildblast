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

function test_largeChunkMesh() {
    //Must reset the setting, their local settings should not impact the test,
    //instead any settings should be set in the test.
    settings = {};

    var manager = new WorkerChunkManager();

    function loadChunk(cc) {
        var chunk = manager.get(cc);
        chunk = new ChunkGeometry(cc, generateRandomBlockArray(), manager);
        manager.set(cc, chunk);
    }

    function calculateGeometry(cc) {
        var chunk = manager.get(cc);
        chunk.calculateGeometries();
    }

    var maxChunk = 1;

    function doTest() {
        LOOP.For3D(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(maxChunk, maxChunk, maxChunk),
            function (chunkPos) {
                loadChunk(chunkPos);
            }
        );

        for (var ix = 0; ix < 1; ix++) {
            LOOP.For3D(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(maxChunk, maxChunk, maxChunk),
                function (chunkPos) {
                    calculateGeometry(chunkPos);
                }
            );
        }
    }

    settings.greedyMesh = 2;
    var greedyTime2 = new Date().getTime();
    doTest();
    greedyTime2 = new Date().getTime() - greedyTime2;

    settings.greedyMesh = 1;
    var greedyTime = new Date().getTime();
    doTest();
    greedyTime = new Date().getTime() - greedyTime;

    settings.greedyMesh = 0;
    var simpleTime = new Date().getTime();
    doTest();
    simpleTime = new Date().getTime() - simpleTime;

    console.log("GreedyOld time: " + greedyTime2);
    console.log("Greedy time: " + greedyTime);
    console.log("Simple time: " + simpleTime);
}