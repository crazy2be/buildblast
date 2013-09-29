function simpleMesh(blocks, voxelization, cc, manager) {
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
	var color = [];

	var voxelization = voxelization;
	var blocks = blocks;

	updateNeighbours();

	//Pick blocks in increments based on the voxelization (like sampling), later code will look through the
	//area and decide what type the block should really be.
	for (var ocX = 0; ocX < cw; ocX += voxelization) {
		for (var ocY = 0; ocY < ch; ocY += voxelization) {
			for (var ocZ = 0; ocZ < cd; ocZ += voxelization) {
				addBlockGeometry(verts, index, color, ocX, ocY, ocZ, voxelization);
			}
		}
	}

	function copy(src, dst) {
		for (var i = 0; i < src.length; i++) {
			dst[i] = src[i];
		}
	}

	var vertsa = new Float32Array(verts.length);
	copy(verts, vertsa);

	var indexa = new Uint16Array(index.length);
	copy(index, indexa);

	var colora = new Float32Array(color.length);
	copy(color, colora);

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
		color: {
			itemSize: 3,
			array: colora,
			numItems: color.length,
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
		transferables: [vertsa.buffer, indexa.buffer, colora.buffer],
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

	function mostCommonBlock(ocX, ocY, ocZ, r) {
		var count = {};
		for (var x = ocX; x < ocX + r; x++) {
			for (var y = ocY; y < ocY + r; y++) {
				for (var z = ocZ; z < ocZ + r; z++) {
					var tempBlock = blockTypeAt(x, y, z);
					if (!(tempBlock in count)) {
						count[tempBlock] = 1;
					} else {
						count[tempBlock]++;
					}
				}
			}
		}
		var maxBlock = -1;
		var maxValue = -1;
		for (var key in count) {
			if (count[key] > maxValue && !Block.isInvisible(parseInt(key))) {
				maxBlock = key;
				maxValue = count[key];
			}
		}
		return parseInt(maxBlock);
	}

	function addBlockGeometry(verts, index, color, ocX, ocY, ocZ, voxelization) {
		var r = voxelization;
		var noise = [];
		if (empty(ocX, ocY, ocZ)) return;

		//py = positive y, as in above the cube.
		//We only draw faces when there is no cube blocking it.
		var px = empty(ocX + r, ocY, ocZ);
		var nx = empty(ocX - r, ocY, ocZ);
		var py = empty(ocX, ocY + r, ocZ);
		var ny = empty(ocX, ocY - r, ocZ);
		var pz = empty(ocX, ocY, ocZ + r);
		var nz = empty(ocX, ocY, ocZ - r);

		var wcX = ocX + ccX*cw;
		var wcY = ocY + ccY*ch;
		var wcZ = ocZ + ccZ*cd;

		var blockType = Block.DIRT;
		if (r === 1) {
			blockType = blockTypeAt(ocX, ocY, ocZ);
		} else {
			blockType = mostCommonBlock(ocX, ocY, ocZ, r);
		}
		if (blockType < 0) return;

		function mod(a, b) {
			return ((a % b) + b) % b;
		}
		function abs(n) {
			return Math.abs(n);
		}
		function clamp(n, a, b) {
			return Math.min(Math.max(n, a), b);
		}

		function inCenter(x, y, z) {
			return Math.abs(mod(x, 1) - 0.5) < 0.001 ||
				Math.abs(mod(y, 1) - 0.5) < 0.001 ||
				Math.abs(mod(z, 1) - 0.5) < 0.001;
		}
		function noiseFunc(x, y, z) {
			function n(q) {
				return perlinNoise(Math.abs(x)/q, Math.abs(y)/q, Math.abs(z)/q);
			}
			var val = n(8) + n(32);
			if (abs(r - 4) > 0.001) val += n(4);
			if (abs(r - 2) > 0.001) val += n(2);
			return clamp(val/2 + 0.5, 0.0, 1.0);
		}

		function v(x, y, z) {
			verts.push(x, y, z);
			noise.push(noiseFunc(x, y, z));
		}

		function f(face, blockType) {
			var l = verts.length / 3;
			// Each face is made up of two triangles
			index.push(l-5, l-4, l-1);
			index.push(l-4, l-3, l-1);
			index.push(l-3, l-2, l-1);
			index.push(l-2, l-5, l-1);

			var c, c2;
			var colours = Block.getColours(blockType, face);
			c = colours.light;
			c2 = colours.dark;

			for (var i = 0; i < 5; i++) {
				var n = noise.shift();
				var r = c.r*n + c2.r*(1 - n);
				var g = c.g*n + c2.g*(1 - n);
				var b = c.b*n + c2.b*(1 - n);
				color.push(r/255, g/255, b/255);
			}
		}

		function anyEmpty(ocX, ocY, ocZ, w, h, d) {
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					for (var z = 0; z < d; z++) {
						if (Block.isInvisible(blockTypeAt(ocX + x, ocY + y, ocZ + z))) {
							return true;
						}
					}
				}
			}
			return false;
		}

		function allEmpty(ocX, ocY, ocZ, w, h, d) {
			for (var x = 0; x < r; x++) {
				for (var y = 0; y < r; y++) {
					for (var z = 0; z < r; z++) {
						if (!Block.isInvisible(blockTypeAt(ocX + x, ocY + y, ocZ + z))) {
							return false;
						}
					}
				}
			}
			return true;
		}

		function empty(ocX, ocY, ocZ) {
			if (r === 1) {
				return Block.isInvisible(blockTypeAt(ocX, ocY, ocZ));
			}

			if (ocX < 0 || ocX >= cw) {
				return anyEmpty(ocX, ocY, ocZ, 1, r, r);
			} else if (ocY < 0 || ocY >= ch) {
				return anyEmpty(ocX, ocY, ocZ, r, 1, r);
			} else if (ocZ < 0 || ocZ >= cd) {
				return anyEmpty(ocX, ocY, ocZ, r, r, 1);
			} else {
				return allEmpty(ocX, ocY, ocZ, r, r, r);
			}
		}

		if (px) {
			v(wcX + r, wcY    , wcZ    );
			v(wcX + r, wcY + r, wcZ    );
			v(wcX + r, wcY + r, wcZ + r);
			v(wcX + r, wcY    , wcZ + r);
			v(wcX + r, wcY + r/2, wcZ + r/2);
			f(0, blockType);
		}
		if (py) {
			v(wcX    , wcY + r, wcZ + r);
			v(wcX + r, wcY + r, wcZ + r);
			v(wcX + r, wcY + r, wcZ    );
			v(wcX    , wcY + r, wcZ    );
			v(wcX + r/2, wcY + r, wcZ + r/2);
			f(2, blockType);
		}
		if (pz) {
			v(wcX    , wcY    , wcZ + r);
			v(wcX + r, wcY    , wcZ + r);
			v(wcX + r, wcY + r, wcZ + r);
			v(wcX    , wcY + r, wcZ + r);
			v(wcX + r/2, wcY + r/2, wcZ + r);
			f(4, blockType);
		}
		if (nx) {
			v(wcX, wcY    , wcZ + r);
			v(wcX, wcY + r, wcZ + r);
			v(wcX, wcY + r, wcZ    );
			v(wcX, wcY    , wcZ    );
			v(wcX, wcY + r/2, wcZ + r/2);
			f(1, blockType);
		}
		if (ny) {
			v(wcX    , wcY, wcZ    );
			v(wcX + r, wcY, wcZ    );
			v(wcX + r, wcY, wcZ + r);
			v(wcX    , wcY, wcZ + r);
			v(wcX + r/2, wcY, wcZ + r/2);
			f(3, blockType);
		}
		if (nz) {
			v(wcX    , wcY + r, wcZ);
			v(wcX + r, wcY + r, wcZ);
			v(wcX + r, wcY    , wcZ);
			v(wcX    , wcY    , wcZ);
			v(wcX + r/2, wcY + r/2, wcZ);
			f(5, blockType);
		}

		return;
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