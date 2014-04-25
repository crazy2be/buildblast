define(function(require) {

var THREE = require("THREE");

var Block = require("./block");

var common = require("./chunkCommon");

var CHUNK = common.CHUNK;

var CHUNK_MATERIAL = new THREE.MeshBasicMaterial({
	vertexColors: true,
});

var ATLAS_MATERIAL =  new THREE.MeshBasicMaterial({
	map: THREE.ImageUtils.loadTexture("img/block_textures/atlas.png")
});

return function Chunk(blocks, geometries, scene) {
	var self = this;

	var mesh = new THREE.Mesh(geometries, ATLAS_MATERIAL);

	self.remove = function () {
		scene.remove(mesh);
	};

	self.add = function () {
		scene.add(mesh);
	};

	self.block = function (oc) {
		if (common.validChunkOffset(oc.x, oc.y, oc.z)) {
			// A flattened array is mesurably faster to
			// index (approximently twice as fast) as
			// an array of arrays, and is a lot less
			// garbage to clean up.
			return new Block(blocks[
				oc.x * CHUNK.WIDTH * CHUNK.HEIGHT +
				oc.y * CHUNK.WIDTH +
				oc.z
			]);
		} else {
			throw "block coords out of bounds: " + oc;
		}
	};

	self.testExposure = {
		blocks: blocks
	};
}
});
