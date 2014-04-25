define(function(require) {
var fatalError = require("fatalError");
var Chunk = require("./chunk");
var common = require("./chunkCommon");

var Conn = require("core/conn");

return function ChunkManager(scene, clientID) {
	var self = this;

	var chunks = {};
	var geometryWorker = new Worker('js/chunks/worker/boot.js');

	self.chunk = function (cc) {
		return chunks[common.ccStr(cc)];
	};

	self.queueBlockChange = function (wcX, wcY, wcZ, newType) {
		geometryWorker.postMessage({
			'kind': 'block-change',
			'payload': {
				'Pos': {X: wcX, Y: wcY, Z: wcZ},
				'Type': newType,
			}
		});
	};

	function startChunkConn(name) {
		geometryWorker.postMessage({
			'kind': 'start-conn',
			'payload': {
				'uri': Conn.socketURI('chunk/' + name),
			}
		});
	}

	geometryWorker.onmessage = function (e) {
		var kind = e.data.kind;
		var payload = e.data.payload;
		if (kind === 'booted') {
			startChunkConn(clientID);
		} else if (kind === 'chunk') {
			processChunk(payload);
		} else if (kind === 'log') {
			var args = ["Geometry worker:"].concat(payload.message);
			console[payload.type || 'log'].apply(console, args);
		}
	};

	geometryWorker.onerror = fatalError;

	function processChunk(payload) {
		var geometry = new THREE.BufferGeometry();
		geometry.attributes = payload.geometry.attributes;
		geometry.offsets = payload.geometry.offsets;

		var cc = payload.ccpos;

		var chunk = self.chunk(cc);
		if (chunk) chunk.remove();

		chunk = new Chunk(payload.blocks, geometry, scene);
		chunk.add();
		chunks[common.ccStr(cc)] = chunk;

		console.log("Added chunk at ", cc);
	}
}
});
