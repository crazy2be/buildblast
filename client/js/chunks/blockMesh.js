define(function (require) {
var Block = require("chunks/block");

var common = require("chunks/chunkCommon");
var CHUNK = common.CHUNK;

// These tables have entries for 5 verticies, which is nice because it lets us
// have a center point (so lighting etc is easier to get symettrical). However,
// we currently only use the first 4, since it's ~20% faster.
var VERTEX_POSITIONS = [
 	[ [ 1, 0, 0 ], [ 1, 1, 0 ], [ 1, 1, 1 ], [ 1, 0, 1 ], [   1, 0.5, 0.5 ] ],
 	[ [ 0, 0, 1 ], [ 0, 1, 1 ], [ 0, 1, 0 ], [ 0, 0, 0 ], [   0, 0.5, 0.5 ] ],
 	[ [ 0, 1, 1 ], [ 1, 1, 1 ], [ 1, 1, 0 ], [ 0, 1, 0 ], [ 0.5,   1, 0.5 ] ],
 	[ [ 0, 0, 0 ], [ 1, 0, 0 ], [ 1, 0, 1 ], [ 0, 0, 1 ], [ 0.5,   0, 0.5 ] ],
 	[ [ 0, 0, 1 ], [ 1, 0, 1 ], [ 1, 1, 1 ], [ 0, 1, 1 ], [ 0.5, 0.5,   1 ] ],
 	[ [ 0, 1, 0 ], [ 1, 1, 0 ], [ 1, 0, 0 ], [ 0, 0, 0 ], [ 0.5, 0.5,   0 ] ],
];

var UV_WINDING = [
 	[ [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0, 0 ], [ 0.5, 0.5 ] ],
 	[ [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0, 0 ], [ 0.5, 0.5 ] ],
 	[ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0.5, 0.5 ] ],
 	[ [ 1, 1 ], [ 0, 1 ], [ 0, 0 ], [ 1, 0 ], [ 0.5, 0.5 ] ],
 	[ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0.5, 0.5 ] ],
 	[ [ 1, 1 ], [ 0, 1 ], [ 0, 0 ], [ 1, 0 ], [ 0.5, 0.5 ] ],
];

// BlockMesh represents a mesh consisting of a series of blocks. It is used for
// meshing chunks, making the cubes shown for blocks in your inventory, and
// hopefully other things by the time you are reading this :).
return function BlockMesh() {
	var self = this;

	var verts = [];
	var indices = [];
	var uvs = [];

	function buildFace(face) {
		var l = verts.length / 3;
		// Each face is made up of two triangles
		indices.push(l-4, l-3, l-1);
		indices.push(l-3, l-2, l-1);
	}

	function buildUv(tileOffset, UV_WINDING) {
		var u = (tileOffset[0] + UV_WINDING[0]) * Block.UV_UNIT;
		var v = (tileOffset[1] + UV_WINDING[1]) * Block.UV_UNIT;
		// Add a 12.5% texel inset at the edges, to prevent rounding artifacts.
		u += (UV_WINDING[0] === 1 ? -1 : 1) / (Block.ATLAS_SIZE * 8);
		v += (UV_WINDING[1] === 1 ? -1 : 1) / (Block.ATLAS_SIZE * 8);
		uvs.push(u, v);
	}

	self.add = function (blockType, position, shownFaces) {
		for (var face = 0; face < 6; face++) {
			if (!shownFaces[face]) continue;

			var tileOffset = Block.getTileOffset(blockType, face);

			for (var vert = 0; vert < 4; vert++) {
				// Each of x, y and z
				for (var comp = 0; comp < 3; comp++) {
					verts.push(position[comp] + VERTEX_POSITIONS[face][vert][comp]);
				}
				buildUv(tileOffset, UV_WINDING[face][vert]);
			}
			buildFace(face);
		}
	};

	// Finalize the meshing, and return an object with attributes and offsets
	// properties suitable for using with a THREE.BufferGeometry.
	self.finish = function () {
		function copy(src, dst) {
			for (var i = 0; i < src.length; i++) {
				dst[i] = src[i];
			}
		}

		// Here we're just copying the native JavaScript numbers into typed
		// arrays, which will eventually be uploaded to the GPU
		var vertsa = new Float32Array(verts.length);
		copy(verts, vertsa);

		var indicesa = new Uint16Array(indices.length);
		copy(indices, indicesa);

		var uvsa = new Float32Array(uvs.length);
		copy(uvs, uvsa);

		// THREE.js BufferGeometry attributes
		var attributes = {
			position: {
				itemSize: 3,
				array: vertsa,
				numItems: verts.length,
			},
			index: {
				itemSize: 1,
				array: indicesa,
				numItems: indices.length,
			},
			uv: {
				itemSize: 2,
				array: uvsa,
				numItems: uvsa.length,
			},
		};

		// TODO: We actually want to have more than one entry here if we have
		// > ~65000 verticies in a chunk. See
		// https://github.com/crazy2be/buildblast/issues/29
		var offsets = [{
			start: 0,
			count: indices.length,
			indices: 0,
		}];

		var transferables = [
			attributes.position.array.buffer,
			attributes.index.array.buffer,
			attributes.uv.array.buffer,
		];

		return {
			attributes: attributes,
			offsets: offsets,
			transferables: transferables,
		};
	};
}
});
