define(function(require) {

var Block = require("chunks/block");

var common = require("chunks/chunkCommon");
var CHUNK = common.CHUNK;

var BlocksGeometry = require("chunks/geometry");

// Should technically be called a "geometrizer" to match THREE.js conventions
// (a geometry is a bunch of verticies etc, a mesh is a geometry + material).
// But nobody uses the word "geometrizer". That's just crazy.
return function simpleMesh(blocks, cc, manager) {
	var cw = CHUNK.WIDTH;
	var cd = CHUNK.DEPTH;
	var ch = CHUNK.HEIGHT;

	var ccX = cc.x;
	var ccY = cc.y;
	var ccZ = cc.z;

	// Neighbouring chunks (for blockTypeAt)
	var nxc, pxc, nyc, pyc, nzc, pzc;

	var trans = Block.isTransparent;

	updateNeighbours();

	var blocksGeometry = new BlocksGeometry();
	for (var ocX = 0; ocX < cw; ocX++) {
		for (var ocY = 0; ocY < ch; ocY++) {
			for (var ocZ = 0; ocZ < cd; ocZ++) {
				addBlockGeometry(blocksGeometry, ocX, ocY, ocZ);
			}
		}
	}
	return blocksGeometry.finish();

	// -- Everything after here is just helper functions.

	// Can get blocks from up to 1 chunk away from out current chunk
	function transparent(ocX, ocY, ocZ) {
		if (ocX < 0) {
			// We should return Block.NIL here instead of returning null,
			// but it's (~15%) slower for some reason I cannot figure out.
			return nxc ? trans(nxc.block(cw - 1, ocY, ocZ)) : false;
		} else if (ocX >= cw) {
			return pxc ? trans(pxc.block(0, ocY, ocZ)) : false;
		} else if (ocY < 0) {
			return nyc ? trans(nyc.block(ocX, ch - 1, ocZ)) : false;
		} else if (ocY >= ch) {
			return pyc ? trans(pyc.block(ocX, 0, ocZ)) : false;
		} else if (ocZ < 0) {
			return nzc ? trans(nzc.block(ocX, ocY, cd - 1)) : false;
		} else if (ocZ >= cd) {
			return pzc ? trans(pzc.block(ocX, ocY, 0)) : false;
		} else {
			return trans(blocks[ocX*cw*ch + ocY*cw + ocZ]);
		}
	}

	function addBlockGeometry(blocksGeometry, ocX, ocY, ocZ) {
		var blockType = blocks[ocX*cw*ch + ocY*cw + ocZ];
		if (blockType === Block.AIR) return;

		// We only draw faces when there is no cube blocking it.
		var shownFaces = [
			transparent(ocX + 1, ocY,     ocZ    ),
			transparent(ocX - 1, ocY,     ocZ    ),
			transparent(ocX,     ocY + 1, ocZ    ),
			transparent(ocX,     ocY - 1, ocZ    ),
			transparent(ocX,     ocY,     ocZ + 1),
			transparent(ocX,     ocY,     ocZ - 1)
		];

		var position = [ocX + ccX*cw, ocY + ccY*ch, ocZ + ccZ*cd];

		blocksGeometry.add(blockType, position, shownFaces);
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
