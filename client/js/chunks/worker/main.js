define(function(require) {
var common = require("chunks/chunkCommon");
var CHUNK = common.CHUNK;

var simpleMesher = require("./mesher");

var ChunkGeometry = require("./chunkGeometry");

var WorkerChunkManager = require("./workerChunkManager");

var Conn = require("core/conn");

function sendChunk() {
	var chunk = manager.top();
	if (!chunk) return;
	var res = chunk.calculateGeometry();
	parent.postMessage({
		kind: 'chunk',
		payload: {
			blocks: chunk.blocks,
			ccpos: chunk.cc,
			geometry: res.geometry,
		}
	}, res.transferables);
	chunk.loaded = true;
	chunk.changed = false;
}

//This means we only update added and removed chunks 1000 / this rate per second.
setInterval(sendChunk, 20);

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
	conn.on('block', processBlockChange);
}

var manager = new WorkerChunkManager();

function processChunk(payload) {
	var size = payload.Size;
	if (size.X != CHUNK.WIDTH ||
		size.Y != CHUNK.HEIGHT ||
		size.Z != CHUNK.DEPTH
	) {
		throw "Got chunk of size which does not match our expected chunk size!";
	}

	var cc = {
		x: payload.CCPos.X,
		y: payload.CCPos.Y,
		z: payload.CCPos.Z,
	};
	var data = payload.Data;

	//Blocks are Block Types (see block.js)
	//ChunkGeometry.block and .setBlock know how to transform 3D vertices
	//into indices in this array.
	var blocks = new Uint8Array(data.length);
	for (var i = 0; i < blocks.length; i++) {
		// 35: # charater. Control charaters
		// are not allowed in JSON strings, and
		// we want to avoid '"', which requires
		// escaping.
		blocks[i] = data.charCodeAt(i) - 35;
	}

	var chunk = manager.get(cc);
	if (chunk) throw "Got chunk data twice! Server bug! Ignoring message..." + JSON.stringify(cc);

	chunk = new ChunkGeometry(cc, blocks, manager, simpleMesher);
	manager.set(cc, chunk);
	manager.refreshNeighbouring(cc);
}

function processBlockChange(payload) {
	var pos = payload.Pos;
	var type = payload.Type;
	var x = pos.X, y = pos.Y, z = pos.Z;
	var coords = common.worldToChunk(x, y, z);
	var cc = coords.c;
	var oc = coords.o;

	var chunk = manager.get(cc);
	if (!chunk) {
		console.warn("Got block change request for (", x, y, z, ") whose chunk which is not loaded. Ignoring.");
		return;
	}

	var block = chunk.block(oc.x, oc.y, oc.z);
	if (!block) throw "Cannot find block within chunk!";

	if (block === type) return;

	chunk.setBlock(oc.x, oc.y, oc.z, type);

	// Invalidate chunks
	var changedChunks = [];
	changedChunks.push(cc);

	function invalidate(bcX, bcY, bcZ) {
		coords = common.worldToChunk(bcX, bcY, bcZ);
		changedChunks.push(coords.c);
	}

	//Invalidate the chunks of a bunch of blocks.
	//If they don't exist we ignore them later.
	invalidate(x + 1, y, z);
	invalidate(x - 1, y, z);
	invalidate(x, y + 1, z);
	invalidate(x, y - 1, z);
	invalidate(x, y, z + 1);
	invalidate(x, y, z - 1);

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
});
