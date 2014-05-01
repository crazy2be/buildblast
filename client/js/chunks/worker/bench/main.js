define(function (require) {
	var common = require('chunks/chunkCommon');
	var CHUNK = common.CHUNK;
	var Block = require('chunks/block');

	var mesher = require('chunks/worker/mesher');
	var ChunkGeometry = require('chunks/worker/chunkGeometry');

	// Mock the manager.
	function ChunkManagerMock() {
		var self = this;
		var neighbour = null;
		self.setNeighbour = function (newNeighbour) {
			neighbour = newNeighbour;
		}
		self.chunkAt = function (ccX, ccY, ccZ) {
			return neighbour;
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
	var manager = new ChunkManagerMock();
	var blocks = generate(flatWorld);
	var geometry = new ChunkGeometry({x: 0, y: 0, z: 0}, blocks, manager, mesher);
	manager.setNeighbour(geometry); // neighbours with ourselves!

	var ITERATIONS = 50;
	return function () {
		var start = Date.now();
		for (var i = 0; i < ITERATIONS; i++) {
			geometry.calculateGeometry();
		}
		var end = Date.now();

		var delta = end - start;
		console.log("Took", delta, "ms to mesh", ITERATIONS, "times. (" + delta / ITERATIONS, "ms each time)");
	}
});
