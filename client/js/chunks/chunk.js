define(function(require) {

var Mesh = require("chunks/mesh");

var Block = require("./block");
var common = require("./chunkCommon");

function Chunk(blocks, geometryResult) {
	var self = this;

	var mesh = new Mesh(geometryResult);

	self.remove = function (scene) {
		scene.remove(mesh);
	};

	self.add = function (scene) {
		scene.add(mesh);
	};

	self.block = function (oc) {
		return new Block(blocks[common.offsetIndex(oc.x, oc.y, oc.z)]);
	};

	self.testExposure = {
		blocks: blocks,
	};
}

return Chunk;
});
