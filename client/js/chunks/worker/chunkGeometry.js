//cc is just a vector giving the chunk coords.
//blocks is the raw block array, filled with block types.
//voxelization is a value describing the 'voxelization', lower values mean more voxelization.

//This is basically just POD, the meshers do all the heavy lifting.
define(function(require) {
	var common = require("../chunkCommon");

	var CHUNK = common.CHUNK;

	return function ChunkGeometry(cc, blocks, manager, chunkMesher) {
		var self = this;

		var cw = CHUNK.WIDTH;
		var ch = CHUNK.HEIGHT;
		var cd = CHUNK.DEPTH;

		self.blocks = blocks;
		self.cc = cc;
		self.priority = 1;
		self.shown = true;
		self.changed = true;
		self.loaded = false;
		self.voxelization = 1;
		self.chunkMesher = chunkMesher;

		self.calculateGeometries = function () {
			var geometries = [];
			var transferables = [];

			CHUNK.VOXELIZATIONS.forEach(function (voxelization) {
				var geometry = { };

				var res = self.chunkMesher(self.blocks, voxelization, self.cc, manager);

				geometry.attributes = res.attributes;
				geometry.offsets = res.offsets;

				geometries.push(geometry);
				transferables.concat(res.transferables);
			});

			return {
				geometries: geometries,
				transferables: transferables,
			};
		}

		self.block = function block(ocX, ocY, ocZ) {
			if (common.validChunkOffset(ocX, ocY, ocZ)) {
				return blocks[ocX*cw*ch + ocY*cw + ocZ];
			} else {
				throw "Invalid offset coords!";
			}
		};

		self.setBlock = function setBlock(ocX, ocY, ocZ, type) {
			if (common.validChunkOffset(ocX, ocY, ocZ)) {
				blocks[ocX*cw*ch + ocY*cw + ocZ] = type;
			} else {
				throw "Invalid offset coords!";
			}
		};
	}
});