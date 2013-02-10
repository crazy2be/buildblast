function ChunkManager(scene, conn) {
    var self = this;

    conn.on('chunk', processChunk);
    conn.on('unload-chunk', processUnloadChunk);

    var chunks = {};

    self.chunkAt = function (cx, cy, cz) {
        var chunk = chunks[cx + "," + cy + "," + cz];
        return chunk;
    }

    self.chunks = function () {
        return chunks;
    }

    function processChunk(payload) {
        var pos = payload.ccpos;
        var size = payload.size;
        if (size.w != CHUNK_WIDTH ||
            size.h != CHUNK_HEIGHT ||
            size.d != CHUNK_DEPTH) {
                throw "Got chunk of size which does not match our expected chunk size!";
            }
        var cx = pos.x;
        var cy = pos.y;
        var cz = pos.z;
        var data = payload.data;
        console.log("Got chunk at ", cx, cy, cz);

        var chunk = self.chunkAt(cx, cy, cz);
        if (chunk) return;

        chunk = new Chunk(self, data, cx, cy, cz);
        chunks[cx + "," + cy + "," + cz] = chunk;
        chunk.addTo(scene);

        refreshChunkNeighbours(cx, cy, cz);
    }

    function processUnloadChunk(payload) {
        var pos = payload.ccpos;
        var cx = pos.x;
        var cy = pos.y;
        var cz = pos.z;
        console.log("Unloading chunk at ", cx, cy, cz);

        var chunk = self.chunkAt(cx, cy, cz);
        if (!chunk) return;

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
