// I use self for other things. Parent makes
// a lot more sence anyway.
var parent = self;
self = null;

importScripts(
    'common.js',
    'geometry.js',
    'noise.js',
    '../conn.js'
);

function sendChunk() {
    var chunk = manager.top();
    if (!chunk) return;
    var res = chunk.calculateGeometry();
    if (res.offsets.count === 0) {
        // Don't bother sending an invisible
        // chunk.
        chunk.loaded = true;
        chunk.changed = false;
        sendChunk();
        return;
    }
    parent.postMessage({
        kind: 'chunk',
        payload: {
            blocks: res.blocks,
            attributes: res.attributes,
            offsets: res.offsets,
            ccpos: chunk.cc,
        }
    }, res.transferables);
    chunk.loaded = true;
    chunk.changed = false;
}

setInterval(sendChunk, 50);

parent.onmessage = function (e) {
    if (e.data.kind === 'start-conn') {
        initConn(e.data.payload);
    } else if (e.data.kind === 'block-change') {
        processBlockChange(e.data.payload);
    } else {
        throw 'Warning: Unknown message recieved from parent!' + JSON.stringify(e.data);
    }
};

function initConn(payload) {
    var conn = new Conn(payload.uri);
    conn.on('chunk', processChunk);
    conn.on('show-chunk', processShowChunk);
    conn.on('hide-chunk', processHideChunk);
}


function ChunkManager() {
    var self = this;
    var chunkList = {};

    self.get = function (cc) {
        return chunkList[ccStr(cc)];
    }

    self.set = function (cc, item) {
        chunkList[ccStr(cc)] = item;
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
        function r(cx, cy, cz) {
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

function processBlockChange(payload) {
    var wc = payload.wc;
    var type = payload.type;
    var coords = worldToChunk(wc.x, wc.y, wc.z);
    var cc = coords.c;
    var oc = coords.o;

    var chunk = manager.get(cc);
    if (!chunk) {
        // We can't console log in a worker :(
//         console.warn("Cannot find chunk to remove from!");
        return;
    }

    var block = chunk.block(o.x, o.y, o.z);
    if (!block) throw "Cannot find block within chunk!";

    if (block === type) return;

    chunk.setBlock(o.x, o.y, o.z, type);

    // Invalidate chunks
    var changedChunks = [];
    changedChunks.push(cc);

    function u(wx, wy, wz) {
        coords = worldToChunk(wx, wy, wz);
        changedChunks.push(coords.c);
    }

    u(wc.x + 1, wc.y, wc.z);
    u(wc.x - 1, wc.y, wc.z);
    u(wc.x, wc.y + 1, wc.z);
    u(wc.x, wc.y - 1, wc.z);
    u(wc.x, wc.y, wc.z + 1);
    u(wc.x, wc.y, wc.z - 1);

    changedChunks = unique(changedChunks);

    for (var i = 0; i < changedChunks.length; i++) {
        var cc = changedChunks[i];
        var chunk = manager.get(cc);
        if (!chunk) continue;
        chunk.changed = true;
        chunk.priority = 2;
    }

    function unique(arr) {
        return arr.filter(function (val, i) {
            return arr.indexOf(val) === i;
        });
    }
}
