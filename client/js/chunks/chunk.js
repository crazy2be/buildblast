var CHUNK_MATERIAL = new THREE.MeshBasicMaterial({
	vertexColors: true,
});

function Chunk(blocks, geometries, scene, voxelization) {
	var self = this;

	var meshes = {};
	for (var i = 0; i < CHUNK_VOXELIZATIONS.length; i++) {
		var mesh = new THREE.Mesh(geometries[i], CHUNK_MATERIAL);
		meshes[CHUNK_VOXELIZATIONS[i]] = mesh;
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
		if (validChunkOffset(oc.x, oc.y, oc.z)) {
			// A flattened array is mesurably faster to
			// index (approximently twice as fast) as
			// an array of arrays, and is a lot less
			// garbage to clean up.
			return new Block(blocks[
				oc.x * CHUNK_WIDTH * CHUNK_HEIGHT +
				oc.y * CHUNK_WIDTH +
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