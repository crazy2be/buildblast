define(function(require) {
var common = require("chunks/chunkCommon");

// cc is just a vector giving the chunk coords.
// blocks is the raw block array, filled with block types.
// This is basically just POD, the meshers do all the heavy lifting.
return function ChunkGeometry(cc, blocks, manager, chunkMesher) {
	var self = this;

	self.blocks = blocks;
	self.cc = cc;
	self.priority = 1;
	self.shown = true;
	self.changed = true;
	self.loaded = false;
	self.chunkMesher = chunkMesher;

	self.calculateGeometry = function () {
		var res = self.chunkMesher(self.blocks, self.cc, manager);

		var geometry = {};
		geometry.attributes = res.attributes;
		geometry.drawcalls = res.drawcalls;

		return {
			geometry: geometry,
			transferables: res.transferables,
		};
	};

	self.block = function block(ocX, ocY, ocZ) {
		return blocks[common.offsetIndex(ocX, ocY, ocZ)];
	};

	self.setBlock = function setBlock(ocX, ocY, ocZ, type) {
		blocks[common.offsetIndex(ocX, ocY, ocZ)] = type;
	};
}
});
