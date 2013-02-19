function ChunkManager(scene, conn) {
    var self = this;

    conn.on('player-id', startChunkConn);

    var chunks = {};
    var geometryWorker = new Worker('js/chunks/worker.js');

    self.chunkAt = function (cx, cy, cz) {
        var chunk = chunks[cx + "," + cy + "," + cz];
        return chunk;
    }

    self.chunks = function () {
        return chunks;
    }

    self.queueBlockChange = function (wx, wy, wz, newType) {
        geometryWorker.postMessage({
            'kind': 'block-change',
            'payload': {
                'wc': {x: wx, y: wy, z: wz},
                'type': newType,
            }
        });
    }

    geometryWorker.onmessage = function (e) {
        var payload = e.data.payload;
        if (e.data.kind === 'chunk') {
            processChunk(payload);
        } else if (e.data.kind === 'unload-chunk') {
            processUnloadChunk(payload);
        } else if (e.data.kind === 'show-chunk') {
            processShowChunk(payload);
        } else if (e.data.kind === 'hide-chunk') {
            processHideChunk(payload);
        }
    }

    function startChunkConn(payload) {
        var id = payload.id;
        geometryWorker.postMessage({
            'kind': 'start-conn',
            'payload': {
                'uri': getWSURI('/ws/chunks/' + id),
            },
        })
    }

    function processChunk(payload) {
        var geometry = new THREE.BufferGeometry();
        geometry.attributes = payload.geometry.attributes;
        geometry.offsets = payload.geometry.offsets;
        var cx = payload.cc.x;
        var cy = payload.cc.y;
        var cz = payload.cc.z;

        var chunk = self.chunkAt(cx, cy, cz);
        if (chunk) chunk.removeFrom(scene);

        chunk = new Chunk(payload.blocks, geometry, cx, cy, cz);
        chunks[cx + "," + cy + "," + cz] = chunk;
        chunk.addTo(scene);
        console.log("Added chunk at ", cx, cy, cz);
    }

    function processShowChunk(payload) {
        var cc = payload.ccpos;
        var chunk = self.chunkAt(cc.x, cc.y, cc.z);
        if (!chunk) {
            console.warn("Got show chunk command for chunk that is not loaded. Likely server bug.");
            return;
        }

        chunk.show();
    }

    function processHideChunk(payload) {
        var cc = payload.ccpos;
        var chunk = self.chunkAt(cc.x, cc.y, cc.z);
        if (!chunk) {
            console.warn("Got hide chunk command for chunk that is not loaded. Likely server bug.");
            return;
        }

        chunk.hide();
    }

    function processUnloadChunk(payload) {
        var pos = payload.ccpos;
        var cx = pos.x;
        var cy = pos.y;
        var cz = pos.z;
        console.log("Unloading chunk at ", cx, cy, cz);

        var chunk = self.chunkAt(cx, cy, cz);
        if (!chunk) {
            console.warn("Got chunk unload command for chunk that is not loaded. Likely server bug.");
            return;
        }

        delete chunks[cx + "," + cy + "," + cz];

        chunk.removeFrom(scene);
        chunk.unload();
    }

    function refreshChunkNeighbours(cx, cy, cz) {
        var c = self.chunkAt;
        var pxc = c(cx + 1, cy, cz);
        if (pxc) pxc.refresh(scene);
        var nxc = c(cx - 1, cy, cz);
        if (nxc) nxc.refresh(scene);
        var pyc = c(cx, cy + 1, cz);
        if (pyc) pyc.refresh(scene);
        var nyc = c(cx, cy - 1, cz);
        if (nyc) nyc.refresh(scene);
        var pzc = c(cx, cy, cz + 1);
        if (pzc) pzc.refresh(scene);
        var nzc = c(cx, cy, cz - 1);
        if (nzc) nzc.refresh(scene);
    }
}
