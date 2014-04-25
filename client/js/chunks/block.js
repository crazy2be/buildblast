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

Block.ATLAS = [
	[0, 0], // Dirt / Grass bottom
	[1, 0], // Grass side
	[2, 0], // Grass top
	[3, 0], // Stone
	[4, 0], // Spawn
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
