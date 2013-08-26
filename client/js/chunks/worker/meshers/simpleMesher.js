function simpleMesh(blocks, voxelization, cc, manager) {
	var cw = CHUNK_WIDTH;
	var cd = CHUNK_DEPTH;
	var ch = CHUNK_HEIGHT;

	var ccx = cc.x;
	var ccy = cc.y;
	var ccz = cc.z;

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
	for (var ocx = 0; ocx < cw; ocx += voxelization) {
		for (var ocy = 0; ocy < ch; ocy += voxelization) {
			for (var ocz = 0; ocz < cd; ocz += voxelization) {
				addBlockGeometry(verts, index, color, ocx, ocy, ocz, voxelization);
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
	function blockTypeAt(ocx, ocy, ocz) {
		if (ocx < 0) {
			return nxc ? nxc.block(cw - 1, ocy, ocz) : null;
		} else if (ocx >= cw) {
			return pxc ? pxc.block(0, ocy, ocz) : null;
		} else if (ocy < 0) {
			return nyc ? nyc.block(ocx, ch - 1, ocz) : null;
		} else if (ocy >= ch) {
			return pyc ? pyc.block(ocx, 0, ocz) : null;
		} else if (ocz < 0) {
			return nzc ? nzc.block(ocx, ocy, cd - 1) : null;
		} else if (ocz >= cd) {
			return pzc ? pzc.block(ocx, ocy, 0) : null;
		} else {
			return blocks[ocx*cw*ch + ocy*cw + ocz];
		}
	}

	function mostCommonBlock(ocx, ocy, ocz, r) {
		var count = {};
		for (var x = ocx; x < ocx + r; x++) {
			for (var y = ocy; y < ocy + r; y++) {
				for (var z = ocz; z < ocz + r; z++) {
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

	function addBlockGeometry(verts, index, color, ocx, ocy, ocz, voxelization) {
		var r = voxelization;
		var noise = [];
		if (empty(ocx, ocy, ocz)) return;

		//py = positive y, as in above the cube.
		//We only draw faces when there is no cube blocking it.
		var px = empty(ocx + r, ocy, ocz);
		var nx = empty(ocx - r, ocy, ocz);
		var py = empty(ocx, ocy + r, ocz);
		var ny = empty(ocx, ocy - r, ocz);
		var pz = empty(ocx, ocy, ocz + r);
		var nz = empty(ocx, ocy, ocz - r);

		var wx = ocx + ccx*cw;
		var wy = ocy + ccy*ch;
		var wz = ocz + ccz*cd;

		var blockType = Block.DIRT;
		if (r === 1) {
			blockType = blockTypeAt(ocx, ocy, ocz);
		} else {
			blockType = mostCommonBlock(ocx, ocy, ocz, r);
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

		function anyEmpty(ocx, ocy, ocz, w, h, d) {
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					for (var z = 0; z < d; z++) {
						if (Block.isInvisible(blockTypeAt(ocx + x, ocy + y, ocz + z))) {
							return true;
						}
					}
				}
			}
			return false;
		}

		function allEmpty(ocx, ocy, ocz, w, h, d) {
			for (var x = 0; x < r; x++) {
				for (var y = 0; y < r; y++) {
					for (var z = 0; z < r; z++) {
						if (!Block.isInvisible(blockTypeAt(ocx + x, ocy + y, ocz + z))) {
							return false;
						}
					}
				}
			}
			return true;
		}

		function empty(ocx, ocy, ocz) {
			if (r === 1) {
				return Block.isInvisible(blockTypeAt(ocx, ocy, ocz));
			}

			if (ocx < 0 || ocx >= cw) {
				return anyEmpty(ocx, ocy, ocz, 1, r, r);
			} else if (ocy < 0 || ocy >= ch) {
				return anyEmpty(ocx, ocy, ocz, r, 1, r);
			} else if (ocz < 0 || ocz >= cd) {
				return anyEmpty(ocx, ocy, ocz, r, r, 1);
			} else {
				return allEmpty(ocx, ocy, ocz, r, r, r);
			}
		}

		if (px) {
			v(wx + r, wy    , wz    );
			v(wx + r, wy + r, wz    );
			v(wx + r, wy + r, wz + r);
			v(wx + r, wy    , wz + r);
			v(wx + r, wy + r/2, wz + r/2);
			f(0, blockType);
		}
		if (py) {
			v(wx    , wy + r, wz + r);
			v(wx + r, wy + r, wz + r);
			v(wx + r, wy + r, wz    );
			v(wx    , wy + r, wz    );
			v(wx + r/2, wy + r, wz + r/2);
			f(2, blockType);
		}
		if (pz) {
			v(wx    , wy    , wz + r);
			v(wx + r, wy    , wz + r);
			v(wx + r, wy + r, wz + r);
			v(wx    , wy + r, wz + r);
			v(wx + r/2, wy + r/2, wz + r);
			f(4, blockType);
		}
		if (nx) {
			v(wx, wy    , wz + r);
			v(wx, wy + r, wz + r);
			v(wx, wy + r, wz    );
			v(wx, wy    , wz    );
			v(wx, wy + r/2, wz + r/2);
			f(1, blockType);
		}
		if (ny) {
			v(wx    , wy, wz    );
			v(wx + r, wy, wz    );
			v(wx + r, wy, wz + r);
			v(wx    , wy, wz + r);
			v(wx + r/2, wy, wz + r/2);
			f(3, blockType);
		}
		if (nz) {
			v(wx    , wy + r, wz);
			v(wx + r, wy + r, wz);
			v(wx + r, wy    , wz);
			v(wx    , wy    , wz);
			v(wx + r/2, wy + r/2, wz);
			f(5, blockType);
		}

		return;
	}

	function updateNeighbours() {
		pxc = manager.chunkAt(ccx + 1, ccy, ccz);
		nxc = manager.chunkAt(ccx - 1, ccy, ccz);
		pyc = manager.chunkAt(ccx, ccy + 1, ccz);
		nyc = manager.chunkAt(ccx, ccy - 1, ccz);
		pzc = manager.chunkAt(ccx, ccy, ccz + 1);
		nzc = manager.chunkAt(ccx, ccy, ccz - 1);
	}
}