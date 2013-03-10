// I use self for other things. Parent makes
// a lot more sence anyway.
var parent = self;

importScripts(
    'common.js',
    'geometry.js',
    'noise.js',
    '../conn.js'
);

function sendChunk() {
    var chunk = manager.top();
    if (!chunk) return;
    var res = chunk.calculateGeometries();
    parent.postMessage({
        kind: 'chunk',
        payload: {
            blocks: chunk.blocks,
            ccpos: chunk.cc,
            geometries: res.geometries,
            quality: chunk.quality,
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
    } else if (e.data.kind === 'player-position') {
        processPlayerPosition(e.data.payload);
    } else {
        throw 'Warning: Unknown message recieved from parent!' + JSON.stringify(e.data);
    }
};

function initConn(payload) {
    var conn = new Conn(payload.uri);
    conn.on('chunk', processChunk);
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

    var blocks = new Uint8Array(data.length);
    for (var i = 0; i < blocks.length; i++) {
        // 32 - Space character. Control characters
        // are not allowed in JSON strings.
        blocks[i] = data.charCodeAt(i) - 32;
    }

    var chunk = manager.get(cc);
    if (chunk) throw "Got chunk data twice! Server bug! Ignoring message...";

    chunk = new ChunkGeometry(cc, blocks, manager);
    manager.set(cc, chunk);
    manager.refreshNeighbouring(cc);
}

function processBlockChange(payload) {
    var wc = payload.wc;
    var type = payload.type;
    var coords = worldToChunk(wc.x, wc.y, wc.z);
    var cc = coords.c;
    var oc = coords.o;

    var chunk = manager.get(cc);
    if (!chunk) {
        // Eventually this should be a throw, as the server
        // will filter block events to only cover chunks
        // we have loaded. However, for now, we get block
        // events for *all* chunks, not just loaded ones.
        // Thus, we have to ignore them here.
        return;
    }

    var block = chunk.block(oc.x, oc.y, oc.z);
    if (!block) throw "Cannot find block within chunk!";

    if (block === type) return;

    chunk.setBlock(oc.x, oc.y, oc.z, type);

    // Invalidate chunks
    var changedChunks = [];
    changedChunks.push(cc);

    function invalidate(wx, wy, wz) {
        coords = worldToChunk(wx, wy, wz);
        changedChunks.push(coords.c);
    }

    invalidate(wc.x + 1, wc.y, wc.z);
    invalidate(wc.x - 1, wc.y, wc.z);
    invalidate(wc.x, wc.y + 1, wc.z);
    invalidate(wc.x, wc.y - 1, wc.z);
    invalidate(wc.x, wc.y, wc.z + 1);
    invalidate(wc.x, wc.y, wc.z - 1);

    changedChunks = unique(changedChunks);

    for (var i = 0; i < changedChunks.length; i++) {
        var cc = changedChunks[i];
        var chunk = manager.get(cc);
        if (!chunk) continue;
        chunk.changed = true;
        chunk.priority = 2;
    }
}

function unique(arr) {
    return arr.filter(function (val, i) {
        return arr.indexOf(val) === i;
    });
}

function processPlayerPosition(payload) {
    var p = payload.pos;
    var coords = worldToChunk(p.x, p.y, p.z);
    var cq = CHUNK_QUALITIES;

    manager.each(function (chunk) {
        var d = dist(coords.c, chunk.cc);

        var quality = cq[clamp(Math.floor(d/2), 0, cq.length - 1)];

        if (chunk.quality === quality || !chunk.loaded) return;

        chunk.quality = quality;
        parent.postMessage({
            'kind': 'chunk-quality-change',
            'payload': {
                'ccpos': chunk.cc,
                'quality': quality,
            },
        });
    });
}

function clamp(n, a, b) {
    return Math.min(Math.max(n, a), b);
}

function dist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
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

    self.each = function (cb) {
        for (var k in chunkList) {
            cb(chunkList[k])
        }
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
