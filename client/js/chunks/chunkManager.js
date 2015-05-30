define(function(require) {
var fatalError = require("fatalError");
var Chunk = require("./chunk");
var common = require("./chunkCommon");

var Conn = require("core/conn");
var Protocol = require("core/protocol");

return function ChunkManager(scene, clientID) {
	var self = this;

	var chunks = {};
	var geometryWorker = new Worker('js/chunks/worker/boot.js');

	self.chunk = function (cc) {
		return chunks[common.ccStr(cc)];
	};

	self.queueBlockChange = function (wcX, wcY, wcZ, newType) {
		var buf = new ArrayBuffer(1);
		var dataView = new DataView(buf);
		dataView.setUint8(0, Protocol.MSG_BLOCK);
		buf = Protocol.append(buf, Protocol.marshalFloat64(wcX));
		buf = Protocol.append(buf, Protocol.marshalFloat64(wcY));
		buf = Protocol.append(buf, Protocol.marshalFloat64(wcZ));
		var temp = new ArrayBuffer(1);
		dataView = new DataView(temp);
		dataView.setUint8(0, newType);
		buf = Protocol.append(buf, temp);
		geometryWorker.postMessage({
			'kind': 'block-change',
			'dataView': new DataView(buf)
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
		var cc = payload.ccpos;

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
