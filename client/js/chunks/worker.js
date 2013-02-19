// I use self for other things. Parent makes
// a lot more sence anyway.
var parent = self;

importScripts(
    'common.js',
    'geometry.js',
    '../conn.js'
);

(function () {
    function sendChunk() {
        var chunk = manager.top();
        if (!chunk) return;
        var res = chunk.calculateGeometry();
        parent.postMessage({
            kind: 'chunk',
            payload: {
                blocks: chunk.blocks,
                geometry: res.obj,
                cc: chunk.cc,
            }
        }, res.transferables);
        chunk.loaded = true;
        chunk.changed = false;
    }

    setInterval(sendChunk, 100);
}());

parent.onmessage = function (e) {
    if (e.data.kind === 'start-conn') {
        initConn(e.data.payload);
    } else {
        console.log('Warning: Unknown message recieved from parent!');
    }
};

function initConn(payload) {
    var conn = new Conn(payload.uri);
    conn.on('chunk', processChunk);
    conn.on('show-chunk', processShowChunk);
    conn.on('hide-chunk', processHideChunk);
    conn.on('unload-chunk', processUnloadChunk);
}


function ChunkManager() {
    var self = this;
    var chunkList = {};

    self.get = function (cc) {
        return chunkList[cc.x + "," + cc.y + "," + cc.z];
    }

    self.set = function (cc, item) {
        chunkList[cc.x + "," + cc.y + "," + cc.z] = item;
    }

    self.top = function () {
        var highest = -1000;
        var key = "";
        for (var k in chunkList) {
            var item = chunkList[k];
            if (item.priority > highest
                && item.shown && item.changed
            ) {
                highest = item.priority;
                key = k;
            }
        }
        return chunkList[key];
    }

    self.chunkAt = function (cx, cy, cz) {
        return self.get({x: cx, y: cy, z: cz});
    }

    self.refreshNeighbouring = function (cc) {
        var cx = cc.x;
        var cy = cc.y;
        var cz = cc.z;
        var r = function (cx, cy, cz) {
            var chunk = self.get({x: cx, y: cy, z: cz});
            if (chunk) chunk.changed = true;
        };
        r(cx + 1, cy, cz);
        r(cx - 1, cy, cz);
        r(cx, cy + 1, cz);
        r(cx, cy - 1, cz);
        r(cx, cy, cz + 1);
        r(cx, cy, cz - 1);
    }
}

var manager = new ChunkManager();

function processShowChunk(payload) {
    var cc = payload.ccpos;
    var chunk = manager.get(cc);
    if (!chunk) {
        throw "Got chunk show message for chunk which was never recieved. Likely server bug.";
    }

    if (chunk.shown) {
        throw "Got chunk show message for visibe chunk. Likely server bug...";
    }

    chunk.shown = true;

    if (chunk.loaded) {
        parent.postMessage({
            kind: 'show-chunk',
            payload: {
                ccpos: cc,
            }
        });
    }
}

function processHideChunk(payload) {
    var cc = payload.ccpos
    var chunk = manager.get(cc);
    if (!chunk) {
        throw "Got chunk hide message for chunk which was never recieved. Likely server bug.";
    }

    if (!chunk.shown) {
        throw "Got chunk hide message for hidden chunk. Likely server bug.";
    }

    chunk.shown = false;

    if (chunk.loaded) {
        parent.postMessage({
            'kind': 'hide-chunk',
            'payload': {
                'ccpos': cc,
            },
        });
    }
}

function processChunk(payload) {
    var size = payload.size;
    if (size.w != CHUNK_WIDTH ||
        size.h != CHUNK_HEIGHT ||
        size.d != CHUNK_DEPTH
    ) {
        throw "Got chunk of size which does not match our expected chunk size!";
    }

    var cc = payload.ccpos;
    var data = payload.data;

    var chunk = manager.get(cc);
    if (chunk) throw "Got chunk data twice! Server bug! Ignoring message...";

    chunk = new ChunkGeometry(cc, data, manager);
    manager.set(cc, chunk);
    manager.refreshNeighbouring(cc);
}
