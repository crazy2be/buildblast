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
Block.prototype.solid = function () {
	return Block.isSolid(this.type);
};

//Block Types
Block.NIL   = 0x0; //Putting this here so its clear it's reserved
Block.AIR   = 0x1;
Block.DIRT  = 0x2;
Block.STONE = 0x3;
Block.SPAWN = 0x4;

//See "Block encoding.txt"

//Block properties
Block.MINEABLE	= 0x80000000;

//Subtypes
// Invisible blocks are ignored by the renderer, and have no physical
// manifestation in the world.
Block.INVISIBLE = 0x1;
// Solid blocks are treated as solid by physics simulations, and will
// prevent entities from occupying the same space as them.
Block.SOLID = 0x2;

Block.PROPERTIES = [
	/** NIL    */ 0,
	/** AIR    */ Block.INVISIBLE,
	/** DIRT   */ Block.SOLID | Block.MINEABLE,
	/** STONE  */ Block.SOLID | Block.MINEABLE,
	/** SPAWN  */ Block.SOLID,
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
		if (face === 2) {
			return Block.ATLAS[2];
		} else if (face === 3) {
			return Block.ATLAS[0];
		} else {
			return Block.ATLAS[1];
		}
	} else if (blockType === Block.STONE) {
		return Block.ATLAS[3];
	} else if (blockType === Block.SPAWN) {
		return Block.ATLAS[4];
	} else {
		throw "I don't know how to render that... TYPE: " + blockType + " FACE: " + face;
	}
};

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
}

Block.isMineable = function (block) {
	return (Block.PROPERTIES[block] & Block.MINEABLE) !== 0;
};

Block.isInvisible = function (block) {
	return Block.inSubtype(block, Block.INVISIBLE);
};

Block.isSolid = function (block) {
	return Block.inSubtype(block, Block.SOLID);
};

Block.inSubtype = function (block, subtype) {
	return (Block.PROPERTIES[block]&subtype) === subtype;
};

return Block;
});
