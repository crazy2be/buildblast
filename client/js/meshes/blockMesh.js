define(function (require) {

var THREE = require("THREE");

var ATLAS_TEXTURE = THREE.ImageUtils.loadTexture("img/block_textures/atlas.png");
ATLAS_TEXTURE.magFilter = THREE.NearestFilter;
ATLAS_TEXTURE.minFilter = THREE.NearestFilter;

var ATLAS_MATERIAL =  new THREE.MeshBasicMaterial({
	map: ATLAS_TEXTURE,
	transparent: true,
	alphaTest: 0.5
});

// takes a chunk/geometry result, NOT a THREE.Geometry
return function Mesh(geometryResult) {
	if (typeof geometryResult.attributes !== 'object' ||
		!Array.isArray(geometryResult.offsets)) {
			throw "Expected chunks/geometryResult.";
	}

	var threeGeometry = new THREE.BufferGeometry();
	threeGeometry.attributes = geometryResult.attributes;
	threeGeometry.offsets = geometryResult.offsets;

	var mesh = new THREE.Mesh(threeGeometry, ATLAS_MATERIAL);

	return mesh;
};

});
