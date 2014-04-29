define(function(require) {

function Block(type) {
	this.type = type;
}
Block.prototype.mineable = function () {
	return Block.isMineable(this.type);
};
Block.prototype.invisible = function () {
	return Block.isInvisible(this.type);
};
Block.prototype.transparent = function () {
	return Block.isTransparent(this.type);
}
Block.prototype.solid = function () {
	return Block.isSolid(this.type);
};

//Block Types
Block.NIL          = 0; //Putting this here so its clear it's reserved
Block.AIR          = 1;
Block.DIRT         = 2;
Block.STONE        = 3;
Block.SPAWN        = 4;
Block.GRASS        = 5;
Block.COAL         = 6;
Block.IRON         = 7;
Block.GOLD         = 8;
Block.SAPPHIRE     = 9;
Block.EMERALD      = 10;
Block.RUBY         = 11;
Block.DIAMOND      = 12;
Block.POUDRETTEITE = 13;
Block.GLASS        = 14;

//See "Block encoding.txt"

//Block properties
Block.UNMINEABLE = 0x80000000;

//Subtypes
// Transparent blocks can be seen through, like glass, spawn blocks, etc.
// We will render faces behind them.
Block.TRANSPARENT = 1 << 0;
// Invisible blocks are ignored by the renderer, and have no physical
// manifestation in the world.
Block.INVISIBLE = (1 << 1) | Block.TRANSPARENT;
// Intangible blocks are ignored by physics simulations, and will
// allow entities to occupy the same space as them.
Block.INTANGIBLE = 1 << 2;

// By default, blocks are visible, tangible, and mineable.
Block.PROPERTIES = [
	/** NIL          */ Block.INVISIBLE | Block.INTANGIBLE | Block.UNMINEABLE,
	/** AIR          */ Block.INVISIBLE | Block.INTANGIBLE | Block.UNMINEABLE,
	/** DIRT         */ 0,
	/** STONE        */ 0,
	/** SPAWN        */ Block.UNMINEABLE | Block.TRANSPARENT,
	/** GRASS        */ 0,
	/** COAL         */ 0,
	/** IRON         */ 0,
	/** GOLD         */ 0,
	/** SAPPHIRE     */ 0,
	/** EMERALD      */ 0,
	/** RUBY         */ 0,
	/** DIAMOND      */ 0,
	/** POUDRETTEITE */ 0,
	/** GLASS        */ Block.TRANSPARENT,
];

Block.ATLAS_SIZE = 128;
Block.TILE_SIZE = 16;
Block.UV_UNIT = Block.TILE_SIZE / Block.ATLAS_SIZE;

// UV indicesed from bottom left (cartesian coordinates).
Block.ATLAS = [
	[0, 7], // Dirt / Grass bottom
	[1, 7], // Grass side
	[2, 7], // Grass top
	[3, 7], // Stone
	[4, 7], // Spawn
	[5, 7], // Coal
	[6, 7], // Iron
	[7, 7], // Gold
	[0, 6], // Sapphire
	[1, 6], // Emerald
	[2, 6], // Ruby
	[3, 6], // Diamond
	[4, 6], // Poudretteite
	[5, 6], // Glass
];

/**
 * Faces:
 * 0 - (+x) Left
 * 1 - (-x) Right
 * 2 - (+y) Top
 * 3 - (-y) Bottom
 * 4 - (+z) Front
 * 5 - (-z) Back
 */
Block.getTileOffset = function (blockType, face) {
	if (blockType === Block.DIRT) {
		return Block.ATLAS[0];
	} else if (blockType === Block.STONE) {
		return Block.ATLAS[3];
	} else if (blockType === Block.SPAWN) {
		return Block.ATLAS[4];
	} else if (blockType === Block.GRASS) {
		if (face === 2) {
			return Block.ATLAS[2];
		} else if (face === 3) {
			return Block.ATLAS[0];
		} else {
			return Block.ATLAS[1];
		}
	} else if (blockType === Block.COAL) {
		return Block.ATLAS[5];
	} else if (blockType === Block.IRON) {
		return Block.ATLAS[6];
	} else if (blockType === Block.GOLD) {
		return Block.ATLAS[7];
	} else if (blockType === Block.SAPPHIRE) {
		return Block.ATLAS[8];
	} else if (blockType === Block.EMERALD) {
		return Block.ATLAS[9];
	} else if (blockType === Block.RUBY) {
		return Block.ATLAS[10];
	} else if (blockType === Block.DIAMOND) {
		return Block.ATLAS[11];
	} else if (blockType === Block.POUDRETTEITE) {
		return Block.ATLAS[12];
	} else if (blockType === Block.GLASS) {
		return Block.ATLAS[13];
	} else {
		throw "I don't know how to render that... TYPE: " + blockType + " FACE: " + face;
	}
};

// TODO: We probably want to move this meshing logic into a seperate file, it's
// starting to grow pretty big now.
Block.addGeometry = function (verts, indices, uvs, shownFaces, blockType, position) {
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

	for (var face = 0; face < 6; face++) {
		if (!shownFaces[face]) continue;

		var tileOffset = Block.getTileOffset(blockType, face);

		for (var vert = 0; vert < 5; vert++) {
			// Each of x, y and z
			for (var comp = 0; comp < 3; comp++) {
				verts.push(position[comp] + positions[face][vert][comp]);
			}
			buildUv(tileOffset, uvWind[face][vert]);
		}
		buildFace(face);
	}

	function buildFace(face) {
		var l = verts.length / 3;
		// Each face is made up of four triangles
		indices.push(l-5, l-4, l-1);
		indices.push(l-4, l-3, l-1);
		indices.push(l-3, l-2, l-1);
		indices.push(l-2, l-5, l-1);
	}

	function buildUv(tileOffset, uvWind) {
		var u = (tileOffset[0] + uvWind[0]) * Block.UV_UNIT;
		var v = (tileOffset[1] + uvWind[1]) * Block.UV_UNIT;
		// Add a 12.5% texel inset at the edges, to prevent rounding artifacts.
		u += (uvWind[0] === 1 ? -1 : 1) / (Block.ATLAS_SIZE * 8);
		v += (uvWind[1] === 1 ? -1 : 1) / (Block.ATLAS_SIZE * 8);
		uvs.push(u, v);
	}
};

Block.makeAttributes = function (verts, indices, uvs) {
	function copy(src, dst) {
		for (var i = 0; i < src.length; i++) {
			dst[i] = src[i];
		}
	}

	// Here we're just copying the native JavaScript numbers into a typed Float32 array.
	// This is required by WebGL for attribute buffers.
	var vertsa = new Float32Array(verts.length);
	copy(verts, vertsa);

	var indicesa = new Uint16Array(indices.length);
	copy(indices, indicesa);

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
			array: indicesa,
			numItems: indices.length,
		},
		uv: {
			itemSize: 2,
			array: uvsa,
			numItems: uvsa.length,
		},
	};

	return attributes;
};

Block.makeOffsets = function (indices) {
	var offsets = [{
		start: 0,
		count: indices.length,
		indices: 0,
	}];
	return offsets;
}

Block.isMineable = function (block) {
	return (Block.PROPERTIES[block] & Block.UNMINEABLE) === 0;
};

Block.isInvisible = function (block) {
	return (Block.PROPERTIES[block] & Block.INVISIBLE) === Block.INVISIBLE;
};

Block.isTransparent = function (block) {
	return (Block.PROPERTIES[block] & Block.TRANSPARENT) == Block.TRANSPARENT;
}

Block.isSolid = function (block) {
	return (Block.PROPERTIES[block] & Block.INTANGIBLE) === 0;
};

return Block;
});
