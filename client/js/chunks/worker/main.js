// I use self for other things. Parent makes
// a lot more sense anyway.
var parent = self;

importScripts(
	'../block.js',
	'../common.js',
	'meshCommon.js',
	'meshers/simpleMesher.js',
	'meshers/simpleNewMesher.js',
	'meshers/greedyMesher.js',
	'chunkGeometry.js',
	'noise.js',
	'../../shared/conn.js',
	'workerChunkManager.js'
);

console = {};
['log', 'warn', 'error'].forEach(function (type) {
	console[type] = function () {
		var args = [].slice.call(arguments);
		parent.postMessage({
			kind: 'log',
			payload: {
				type: type,
				message: args,
			},
		});
	};
});

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
			voxelization: chunk.voxelization,
		}
	}, res.transferables);
	chunk.loaded = true;
	chunk.changed = false;
}

//This means we only update added and removed chunks 1000 / this rate per second.
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
	conn.on('block', processBlockChange);
}

var manager = new WorkerChunkManager();

function processChunk(payload) {
	var size = payload.Size;
	if (size.X != CHUNK_WIDTH ||
		size.Y != CHUNK_HEIGHT ||
		size.Z != CHUNK_DEPTH
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
		// 32 - Space character. Control characters
		// are not allowed in JSON strings.
		blocks[i] = data.charCodeAt(i) - 32;
	}

	var chunk = manager.get(cc);
	if (chunk) throw "Got chunk data twice! Server bug! Ignoring message..." + JSON.stringify(cc);

	chunk = new ChunkGeometry(cc, blocks, manager, greedyMesher);
	manager.set(cc, chunk);
	manager.refreshNeighbouring(cc);
}

function processBlockChange(payload) {
	var pos = payload.Pos;
	var type = payload.Type;
	var x = pos.X, y = pos.Y, z = pos.Z;
	var coords = worldToChunk(x, y, z);
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
		coords = worldToChunk(bcX, bcY, bcZ);
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

function processPlayerPosition(payload) {
	var p = payload.pos;
	var coords = worldToChunk(p.x, p.y, p.z);
	var cv = CHUNK_VOXELIZATIONS;

	manager.each(function (chunk) {
		var d = dist(coords.c, chunk.cc);

		var voxelization = cv[clamp(Math.floor(d/2), 0, cv.length - 1)];

		if (chunk.voxelization === voxelization || !chunk.loaded) return;

		chunk.voxelization = voxelization;
		parent.postMessage({
			'kind': 'chunk-voxelization-change',
			'payload': {
				'ccpos': chunk.cc,
				'voxelization': voxelization,
			},
		});
	});
}

function dist(p1, p2) {
	return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
}

function clamp(n, a, b) {
	return Math.min(Math.max(n, a), b);
}
