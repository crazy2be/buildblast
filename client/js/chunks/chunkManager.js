define(function(require) {
var fatalError = require("fatalError");
var Chunk = require("./chunk");
var common = require("./chunkCommon");

var Conn = require("core/conn");
var Protocol = require("core/protocol");

return function ChunkManager(scene, clientId) {
	var self = this;

	var chunks = {};
	var geometryWorker = new Worker('js/chunks/worker/boot.js');

	self.chunk = function (cc) {
		return chunks[common.ccStr(cc)];
	};

	self.queueBlockChange = function (msgDataView) {
		geometryWorker.postMessage({
			'kind': 'block-change',
			'dataView': msgDataView
		});
	};

	function startChunkConn(name) {
		geometryWorker.postMessage({
			'kind': 'start-conn',
			'payload': {
				'uri': Conn.socketURI('chunk/' + name)
			}
		});
	}

	geometryWorker.onmessage = function (e) {
		var kind = e.data.kind;
		var payload = e.data.payload;
		if (kind === 'booted') {
			startChunkConn(clientId);
		} else if (kind === 'chunk') {
			processChunk(payload);
		} else if (kind === 'log') {
			var args = ["Geometry worker:"].concat(payload.message);
			console[payload.type || 'log'].apply(console, args);
		}
	};

	geometryWorker.onerror = fatalError;

	function processChunk(payload) {
		var cc = payload.cpos;

		var chunk = self.chunk(cc);
		if (chunk) {
			chunk.remove(scene);
		}

		var geometryResult = payload.geometry;
		chunk = new Chunk(payload.blocks, geometryResult);
		chunk.add(scene);
		chunks[common.ccStr(cc)] = chunk;

		console.log("Added chunk at ", cc);
	}
}
});
