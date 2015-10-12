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
		!Array.isArray(geometryResult.drawcalls)) {
			throw "Expected chunks/geometryResult.";
	}

	var attrs = geometryResult.attributes;

	var threeGeometry = new THREE.BufferGeometry();
	threeGeometry.setIndex(new THREE.BufferAttribute(attrs.index.array, attrs.index.itemSize));
	threeGeometry.addAttribute('position',
		new THREE.BufferAttribute(attrs.position.array, attrs.position.itemSize));
	threeGeometry.addAttribute('uv', new THREE.BufferAttribute(attrs.uv.array, attrs.uv.itemSize));
	threeGeometry.drawcalls = geometryResult.drawcalls;

	return new THREE.Mesh(threeGeometry, ATLAS_MATERIAL);
};

});
