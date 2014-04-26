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
	var indices = [];
	var uvs = [];

	var blocks = blocks;

	updateNeighbours();

	for (var ocX = 0; ocX < cw; ocX++) {
		for (var ocY = 0; ocY < ch; ocY++) {
			for (var ocZ = 0; ocZ < cd; ocZ++) {
				addBlockGeometry(verts, indices, uvs, ocX, ocY, ocZ);
			}
		}
	}

	var attributes = Block.makeAttributes(verts, indices, uvs);
	var offsets = Block.makeOffsets(indices);


	return {
		attributes: attributes,
		offsets: offsets,
		transferables: [
			attributes.position.array.buffer,
			attributes.index.array.buffer,
			attributes.uv.array.buffer,
		],
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

	function addBlockGeometry(verts, indices, uvs, ocX, ocY, ocZ) {
		if (empty(ocX, ocY, ocZ)) return;

		var blockType = blockTypeAt(ocX, ocY, ocZ);

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

		var position = [ocX + ccX*cw, ocY + ccY*ch, ocZ + ccZ*cd];

		Block.addGeometry(verts, indices, uvs, shown, blockType, position);
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
