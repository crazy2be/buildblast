importScripts('chunkGeometry.js', 'conn.js');

var chunks = {};

function ChunkManager() {
    var self = this;
    self.chunkAt = function (cx, cy, cz) {
        var chunk = chunks[cx + "," + cy + "," + cz];
        return chunk;
    }
}

var manager = new ChunkManager();

self.onmessage = function (e) {
    if (e.data.kind === 'chunk') {
        processChunk(e.data.payload);
    } else if (e.data.kind === 'start-conn') {
        initConn(e.data.payload);
    } else {
        console.log('Warning: Unknown message recieved from parent!');
    }
};

var chunkConn;
function initConn(payload) {
    chunkConn = new Conn(payload.uri);
    chunkConn.on('chunk', processChunk);
}

queuedChunks = {};
function queueChunk(chunk) {
    queuedChunks[chunk.cx + "," + chunk.cy + "," + chunk.cz] = chunk;
}

function getAnElement(obj) {
    for (key in obj) {
        var val = obj[key];
        delete obj[key];
        return val;
    }
}

function sendChunk() {
    chunk = getAnElement(queuedChunks);
    if (!chunk) return;
    var res = chunk.calculateGeometry();
    self.postMessage({
        'kind': 'chunk',
        'payload': {
            blocks: chunk.data,
            geometry: res.obj,
            cx: chunk.cx,
            cy: chunk.cy,
            cz: chunk.cz,
        }
    }, res.transferables);
}

setInterval(sendChunk, 100);

function processChunk(payload) {
    var pos = payload.ccpos;
    var size = payload.size;

    var cx = pos.x;
    var cy = pos.y;
    var cz = pos.z;

    var data = payload.data;

    var chunk = new ChunkGeometry(manager, data, cx, cy, cz);
    chunks[cx + "," + cy + "," + cz] = chunk;
    queueChunk(chunk);

    refreshChunkNeighbours(cx, cy, cz);
}

function refreshChunkNeighbours(cx, cy, cz) {
    var r = function (cx, cy, cz) {
        var chunk = manager.chunkAt(cx, cy, cz);
        if (chunk) {
            chunk.refreshNeighbours();
            queueChunk(chunk);
        }
    };
    r(cx + 1, cy, cz);
    r(cx - 1, cy, cz);
    r(cx, cy + 1, cz);
    r(cx, cy - 1, cz);
    r(cx, cy, cz + 1);
    r(cx, cy, cz - 1);
}

// function processUnloadChunk(payload) {
//     var pos = payload.ccpos;
//     var cx = pos.x;
//     var cy = pos.y;
//     var cz = pos.z;
//     console.log("Unloading chunk at ", cx, cy, cz);
//
//     var chunk = self.chunkAt(cx, cy, cz);
//     if (!chunk) {
//         console.warn("Got chunk unload command for chunk that is not loaded. Likely server bug.");
//         return;
//     }
//
//     delete chunks[cx + "," + cy + "," + cz];
//
//     chunk.removeFrom(scene);
//     chunk.unload();
// }
