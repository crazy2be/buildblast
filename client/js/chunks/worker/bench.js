// This file benchmarks the mesh generation code.
// run it with
//	node bench.js
// and speed up all the meshing!

var fs = require('fs');

// Hacks to mock require. Yay dependency injection!
function requireJS(relativePath) {
	var path = '../../../' + relativePath + '.js';
	var code = fs.readFileSync(path);
	var lastDefine = null;
	function define(ctor) {
		lastDefine = ctor;
	}
	eval(code.toString());
	var module = lastDefine(requireJS);
	return module;
}

var common = requireJS('chunks/chunkCommon');
var CHUNK = common.CHUNK;
var Block = requireJS('chunks/block');

// Mock the manager.
function ChunkManagerMock() {
	var self = this;
	self.chunkAt = function (ccX, ccY, ccZ) {
		return null;
	};
}

// Test data
function generate(generator) {
	var cw = CHUNK.WIDTH;
	var cd = CHUNK.DEPTH;
	var ch = CHUNK.HEIGHT;
	var blocks = new Uint8Array(cw*cd*ch);
	for (var ocX = 0; ocX < cw; ocX++) {
		for (var ocY = 0; ocY < ch; ocY++) {
			for (var ocZ = 0; ocZ < cd; ocZ++) {
				block = generator(ocX, ocY, ocZ);
				var i = common.offsetIndex(ocX, ocY, ocZ);
				blocks[i] = block;
			}
		}
	}
	return blocks;
}

function flatWorld(ocX, ocY, ocZ) {
	if (ocY < 15) {
		return Block.DIRT;
	} else {
		return Block.AIR;
	}
}
// TODO: Add more things to test with, maybe a sideways hill?

// Benchmark the meshers!
var mesher = requireJS('chunks/worker/mesher');
var ChunkGeometry = requireJS('chunks/worker/chunkGeometry');

var manager = new ChunkManagerMock();
var blocks = generate(flatWorld);
var geometry = new ChunkGeometry({x: 0, y: 0, z: 0}, blocks, manager, mesher);

var ITERATIONS = 25;
var start = Date.now();
for (var i = 0; i < ITERATIONS; i++) {
	geometry.calculateGeometry();
}
var end = Date.now();

var delta = end - start;
console.log("Took", delta, "ms to mesh", ITERATIONS, "times. (" + delta / ITERATIONS, "ms each time)");
