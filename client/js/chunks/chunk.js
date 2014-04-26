define(function(require) {

var THREE = require("THREE");

var Block = require("./block");
var common = require("./chunkCommon");

var CHUNK_MATERIAL = new THREE.MeshBasicMaterial({
	vertexColors: true,
});

var ATLAS_TEXTURE = THREE.ImageUtils.loadTexture("img/block_textures/atlas.png");
ATLAS_TEXTURE.magFilter = THREE.NearestFilter;
ATLAS_TEXTURE.minFilter = THREE.NearestFilter;

var ATLAS_MATERIAL =  new THREE.MeshBasicMaterial({
	map: ATLAS_TEXTURE
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
		return new Block(blocks[common.offsetIndex(oc.x, oc.y, oc.z)]);
	};

	self.testExposure = {
		blocks: blocks
	};
}
});
