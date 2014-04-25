define(function(require) {

var Block = require("chunks/block");

var common = require("chunks/chunkCommon");
var CHUNK = common.CHUNK;

return function simpleMesh(blocks, cc, manager) {
	var cw = CHUNK.WIDTH;
	var cd = CHUNK.DEPTH;
	var ch = CHUNK.HEIGHT;

	var ccX = cc.x;
	var ccY = cc.y;
	var ccZ = cc.z;

	// Neighbouring chunks (for blockTypeAt)
	var nxc, pxc, nyc, pyc, nzc, pzc;

	var verts = [];
	var index = [];
	var uvs = [];

	var blocks = blocks;

	updateNeighbours();

	for (var ocX = 0; ocX < cw; ocX++) {
		for (var ocY = 0; ocY < ch; ocY++) {
			for (var ocZ = 0; ocZ < cd; ocZ++) {
				addBlockGeometry(verts, index, uvs, ocX, ocY, ocZ);
			}
		}
	}

	/**
	 * This function copies JavaScript floats into a typed array.
	 */
	function copy(src, dst) {
		for (var i = 0; i < src.length; i++) {
			dst[i] = src[i];
		}
	}

	var vertsa = new Float32Array(verts.length);
	copy(verts, vertsa);

	var indexa = new Uint16Array(index.length);
	copy(index, indexa);

	var uvsa = new Float32Array(uvs.length);
	copy(uvs, uvsa);

	//See the readme for documentation.
	var attributes = {
		position: {
			itemSize: 3,
			array: vertsa,
			numItems: verts.length,
		},
		index: {
			itemSize: 1,
			array: indexa,
			numItems: index.length,
		},
		uv: {
			itemSize: 2,
			array: uvsa,
			numItems: uvsa.length,
		},
	};
	var offsets = [{
		start: 0,
		count: index.length,
		index: 0,
	}];

	return {
		attributes: attributes,
		offsets: offsets,
		transferables: [vertsa.buffer, indexa.buffer, uvsa.buffer],
	};

	//Everything after here is just helper functions.

	//Can get blocks from up to 1 chunk away from out current chunk
	function blockTypeAt(ocX, ocY, ocZ) {
		if (ocX < 0) {
			return nxc ? nxc.block(cw - 1, ocY, ocZ) : null;
		} else if (ocX >= cw) {
			return pxc ? pxc.block(0, ocY, ocZ) : null;
		} else if (ocY < 0) {
			return nyc ? nyc.block(ocX, ch - 1, ocZ) : null;
		} else if (ocY >= ch) {
			return pyc ? pyc.block(ocX, 0, ocZ) : null;
		} else if (ocZ < 0) {
			return nzc ? nzc.block(ocX, ocY, cd - 1) : null;
		} else if (ocZ >= cd) {
			return pzc ? pzc.block(ocX, ocY, 0) : null;
		} else {
			return blocks[ocX*cw*ch + ocY*cw + ocZ];
		}
	}

	function addBlockGeometry(verts, index, uvs, ocX, ocY, ocZ) {
		if (empty(ocX, ocY, ocZ)) return;

		var blockType = blockTypeAt(ocX, ocY, ocZ);
		if (blockType < 0) return;

		//We only draw faces when there is no cube blocking it.
		var shown = [
			empty(ocX + 1, ocY,     ocZ    ),
			empty(ocX - 1, ocY,     ocZ    ),
			empty(ocX,     ocY + 1, ocZ    ),
			empty(ocX,     ocY - 1, ocZ    ),
			empty(ocX,     ocY,     ocZ + 1),
			empty(ocX,     ocY,     ocZ - 1)
		];

		function empty(ocX, ocY, ocZ) {
			return Block.isInvisible(blockTypeAt(ocX, ocY, ocZ));
		}
		var positions = [
			[ [ 1, 0, 0 ], [ 1, 1, 0 ], [ 1, 1, 1 ], [ 1, 0, 1 ], [   1, 0.5, 0.5 ] ],
			[ [ 0, 0, 1 ], [ 0, 1, 1 ], [ 0, 1, 0 ], [ 0, 0, 0 ], [   0, 0.5, 0.5 ] ],
			[ [ 0, 1, 1 ], [ 1, 1, 1 ], [ 1, 1, 0 ], [ 0, 1, 0 ], [ 0.5,   1, 0.5 ] ],
			[ [ 0, 0, 0 ], [ 1, 0, 0 ], [ 1, 0, 1 ], [ 0, 0, 1 ], [ 0.5,   0, 0.5 ] ],
			[ [ 0, 0, 1 ], [ 1, 0, 1 ], [ 1, 1, 1 ], [ 0, 1, 1 ], [ 0.5, 0.5,   1 ] ],
			[ [ 0, 1, 0 ], [ 1, 1, 0 ], [ 1, 0, 0 ], [ 0, 0, 0 ], [ 0.5, 0.5,   0 ] ],
		];

		var uvWind = [
			[ [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0, 0 ], [ 0.5, 0.5 ] ],
			[ [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0, 0 ], [ 0.5, 0.5 ] ],
			[ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0.5, 0.5 ] ],
			[ [ 1, 1 ], [ 0, 1 ], [ 0, 0 ], [ 1, 0 ], [ 0.5, 0.5 ] ],
			[ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0.5, 0.5 ] ],
			[ [ 1, 1 ], [ 0, 1 ], [ 0, 0 ], [ 1, 0 ], [ 0.5, 0.5 ] ],
		];

		var worldCords = [ocX + ccX*cw, ocY + ccY*ch, ocZ + ccZ*cd];

		var faceOrder = [0, 2, 4, 1, 3, 5];
		for (var i = 0; i < 6; i++) {
			var face = faceOrder[i];
			if (!shown[face]) continue;

			var tileOffset = Block.getTileOffset(blockType, face);

			for (var vert = 0; vert < 5; vert++) {
				// Each of x, y and z
				for (var comp = 0; comp < 3; comp++) {
					verts.push(worldCords[comp] + positions[face][vert][comp]);
				}
				buildUv(tileOffset, uvWind[face][vert]);
			}
			buildFace(face)
		}

		function buildFace(face) {
			var l = verts.length / 3;
			// Each face is made up of four triangles
			index.push(l-5, l-4, l-1);
			index.push(l-4, l-3, l-1);
			index.push(l-3, l-2, l-1);
			index.push(l-2, l-5, l-1);
		}

		function buildUv(tileOffset, uvWind) {
			var u = tileOffset[0] * Block.UV_UNIT;
			var v = 1 - Block.UV_UNIT - (tileOffset[1] * Block.UV_UNIT);
			u += uvWind[0] * Block.UV_UNIT;
			v += uvWind[1] * Block.UV_UNIT;
			// Add a 12.5% texel inset at the edges, to prevent rounding artifacts.
			u += (uvWind[0] === 1 ? -1 : 1) / (Block.ATLAS_SIZE * 8);
			v += (uvWind[1] === 1 ? -1 : 1) / (Block.ATLAS_SIZE * 8);
			uvs.push(u, v);
		}
	}

	function updateNeighbours() {
		pxc = manager.chunkAt(ccX + 1, ccY, ccZ);
		nxc = manager.chunkAt(ccX - 1, ccY, ccZ);
		pyc = manager.chunkAt(ccX, ccY + 1, ccZ);
		nyc = manager.chunkAt(ccX, ccY - 1, ccZ);
		pzc = manager.chunkAt(ccX, ccY, ccZ + 1);
		nzc = manager.chunkAt(ccX, ccY, ccZ - 1);
	}
}
});
