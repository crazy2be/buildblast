define(function(require) {

	var THREE = require("THREE");

	var Block = require("./block");

	var common = require("./chunkCommon");

	var CHUNK = common.CHUNK;

	var CHUNK_MATERIAL = new THREE.MeshBasicMaterial({
		vertexColors: true,
	});

	return function Chunk(blocks, geometries, scene, voxelization) {
		var self = this;

		var meshes = {};
		for (var i = 0; i < CHUNK.VOXELIZATIONS.length; i++) {
			var mesh = new THREE.Mesh(geometries[i], CHUNK_MATERIAL);
			meshes[CHUNK.VOXELIZATIONS[i]] = mesh;
		}

		self.remove = function () {
			scene.remove(meshes[voxelization]);
		};

		self.add = function () {
			scene.add(meshes[voxelization]);
		};

		self.setVoxelization = function (newVoxelization) {
			self.remove();
			voxelization = newVoxelization;
			self.add();
		};

		self.voxelization = function() {
			return voxelization;
		}

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