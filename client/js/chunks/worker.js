importScripts('common.js', 'geometry.js', '../conn.js');

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
    if (e.data.kind === 'start-conn') {
        initConn(e.data.payload);
    } else {
        console.log('Warning: Unknown message recieved from parent!');
    }
};

var chunkConn;
function initConn(payload) {
    chunkConn = new Conn(payload.uri);
    chunkConn.on('chunk', processChunk);
    chunkConn.on('show-chunk', processShowChunk);
    chunkConn.on('hide-chunk', processHideChunk);
    chunkConn.on('unload-chunk', processUnloadChunk);
}

queuedChunks = {};
function queueChunk(chunk) {
    queuedChunks[chunk.cx + "," + chunk.cy + "," + chunk.cz] = chunk;
}

function queuedChunk(cx, cy, cz) {
    return queuedChunks[cx + "," + cy + "," + cz];
}

// TODO: Fix this to use a proper priority
// queue (with chunks closer the the player
// considered higher priority than ones
// far away)
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
            blocks: chunk.blocks,
            geometry: res.obj,
            cx: chunk.cx,
            cy: chunk.cy,
            cz: chunk.cz,
        }
    }, res.transferables);
}

setInterval(sendChunk, 100);

function processChunk(payload) {
    var cc = payload.ccpos;
    var size = payload.size;
    if (size.w != CHUNK_WIDTH ||
        size.h != CHUNK_HEIGHT ||
        size.d != CHUNK_DEPTH) {
            throw "Got chunk of size which does not match our expected chunk size!";
        }

    var cx = cc.x;
    var cy = cc.y;
    var cz = cc.z;

    var data = payload.data;

    var chunk = manager.chunkAt(cx, cy, cz);
    if (chunk) throw "Got chunk data twice! Server bug! Ignoring message...";
    chunk = new ChunkGeometry(manager, data, cx, cy, cz);
    chunks[cx + "," + cy + "," + cz] = chunk;
    queueChunk(chunk);

    refreshChunkNeighbours(cx, cy, cz);
}

function processShowChunk(payload) {
    var cc = payload.ccpos;
    self.postMessage({
        'kind': 'show-chunk',
        'payload': {
            'ccpos': cc,
        }
    });
}

function processHideChunk(payload) {
    var cc = payload.ccpos
    var chunk = queuedChunk(cc.x, cc.y, cc.z);
    if (chunk) {
        delete chunk;
        // TODO: If we already have the chunk loaded
        // in the game thread, AND it's queued for an
        // update, we should just push it to the back
        // of the list, or move it to another list
        // to be processed when it comes visible
        // again.
    } else {
        self.postMessage({
            'kind': 'hide-chunk',
            'payload': {
                'ccpos': cc,
            },
        });
    }
}

function refreshChunkNeighbours(cx, cy, cz) {
    var r = function (cx, cy, cz) {
        var chunk = manager.chunkAt(cx, cy, cz);
        if (chunk) {
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
