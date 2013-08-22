//Returns: (same as greedyMesher)
//{
//    attributes: {
//            position: { //x, y, z (triangles)
//                itemSize: 3,
//                array: vertsa,
//                numItems: verts.length,
//            },
//            color: { //colors of positions (vertices), we use a vertex shader
//                     //(possibly a built in one) to color the faces based on these.
//                itemSize: 3,
//                array: colora,
//                numItems: color.length,
//            },
//            index: { //triangle indices inside position (so *3 for real index), every 3 make up a triangle.
//                itemSize: 1,
//                array: indexa,
//                numItems: index.length,
//            },
//        },
//    offsets: [{ //Just states the index size, you could theoretically have multiple of these?
//            start: 0,
//            count: index.length,
//            index: 0,
//        }],
//    transferables: [vertsa.buffer, indexa.buffer, colora.buffer],
//};
function simpleMesh(blocks, quality, cc, manager) {
	var cw = CHUNK_WIDTH;
	var cd = CHUNK_DEPTH;
	var ch = CHUNK_HEIGHT;

	var cx = cc.x;
	var cy = cc.y;
	var cz = cc.z;

	// Neighbouring chunks (for blockTypeAt)
	var nxc, pxc, nyc, pyc, nzc, pzc;

	var verts = [];
	var index = [];
	var color = [];

	var quality = quality;
	var blocks = blocks;

	updateNeighbours();

	//Pick blocks in increments based on the quality (like sampling), later code will look through the
	//area and decide what type the block should really be.
	for (var ox = 0; ox < cw * quality; ox++) {
		for (var oy = 0; oy < ch * quality; oy++) {
			for (var oz = 0; oz < cd * quality; oz++) {
				addBlockGeometry(verts, index, color, ox / quality, oy / quality, oz / quality, quality);
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
	function blockTypeAt(ox, oy, oz) {
		if (ox < 0) {
			return nxc ? nxc.block(cw - 1, oy, oz) : null;
		} else if (ox >= cw) {
			return pxc ? pxc.block(0, oy, oz) : null;
		} else if (oy < 0) {
			return nyc ? nyc.block(ox, ch - 1, oz) : null;
		} else if (oy >= ch) {
			return pyc ? pyc.block(ox, 0, oz) : null;
		} else if (oz < 0) {
			return nzc ? nzc.block(ox, oy, cd - 1) : null;
		} else if (oz >= cd) {
			return pzc ? pzc.block(ox, oy, 0) : null;
		} else {
			return blocks[ox*cw*ch + oy*cw + oz];
		}
	}

	function mostCommonBlock(ox, oy, oz, r) {
		var count = {};
		for (var x = ox; x < ox + r; x++) {
			for (var y = oy; y < oy + r; y++) {
				for (var z = oz; z < oz + r; z++) {
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
			if (count[key] > maxValue && !Block.isEmpty(parseInt(key))) {
				maxBlock = key;
				maxValue = count[key];
			}
		}
		return parseInt(maxBlock);
	}

	function addBlockGeometry(verts, index, color, ox, oy, oz, quality) {
		var r = 1 / quality;
		var noise = [];
		if (empty(ox, oy, oz)) return;

		//py = positive y, as in above the cube.
		//We only draw faces when there is no cube blocking it.
		var px = empty(ox + r, oy, oz);
		var nx = empty(ox - r, oy, oz);
		var py = empty(ox, oy + r, oz);
		var ny = empty(ox, oy - r, oz);
		var pz = empty(ox, oy, oz + r);
		var nz = empty(ox, oy, oz - r);

		var wx = ox + cx*cw;
		var wy = oy + cy*ch;
		var wz = oz + cz*cd;

		var blockType = Block.DIRT;
		if (r === 1) {
			blockType = blockTypeAt(ox, oy, oz);
		} else {
			blockType = mostCommonBlock(ox, oy, oz, r);
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

		function anyEmpty(ox, oy, oz, w, h, d) {
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					for (var z = 0; z < d; z++) {
						if (Block.isEmpty(blockTypeAt(ox + x, oy + y, oz + z))) {
							return true;
						}
					}
				}
			}
			return false;
		}

		function allEmpty(ox, oy, oz, w, h, d) {
			for (var x = 0; x < r; x++) {
				for (var y = 0; y < r; y++) {
					for (var z = 0; z < r; z++) {
						if (!Block.isEmpty(blockTypeAt(ox + x, oy + y, oz + z))) {
							return false;
						}
					}
				}
			}
			return true;
		}

		function empty(ox, oy, oz) {
			if (r === 1) {
				return Block.isEmpty(blockTypeAt(ox, oy, oz));
			}

			if (ox < 0 || ox >= cw) {
				return anyEmpty(ox, oy, oz, 1, r, r);
			} else if (oy < 0 || oy >= ch) {
				return anyEmpty(ox, oy, oz, r, 1, r);
			} else if (oz < 0 || oz >= cd) {
				return anyEmpty(ox, oy, oz, r, r, 1);
			} else {
				return allEmpty(ox, oy, oz, r, r, r);
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
		pxc = manager.chunkAt(cx + 1, cy, cz);
		nxc = manager.chunkAt(cx - 1, cy, cz);
		pyc = manager.chunkAt(cx, cy + 1, cz);
		nyc = manager.chunkAt(cx, cy - 1, cz);
		pzc = manager.chunkAt(cx, cy, cz + 1);
		nzc = manager.chunkAt(cx, cy, cz - 1);
	}
}
