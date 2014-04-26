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
Block.NIL          = 0x0; //Putting this here so its clear it's reserved
Block.AIR          = 0x1;
Block.DIRT         = 0x2;
Block.STONE        = 0x3;
Block.SPAWN        = 0x4;
Block.COAL         = 0x5;
Block.IRON         = 0x6;
Block.GOLD         = 0x7;
Block.SAPPHIRE     = 0x8;
Block.EMERALD      = 0x9;
Block.RUBY         = 0xA;
Block.DIAMOND      = 0xB;
Block.POUDRETTEITE = 0xC;
Block.TOTAL        = 13;

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
	/** NIL          */ 0,
	/** AIR          */ Block.INVISIBLE,
	/** DIRT         */ Block.SOLID | Block.MINEABLE,
	/** STONE        */ Block.SOLID | Block.MINEABLE,
	/** SPAWN        */ Block.SOLID,
	/** Grass        */ Block.SOLID | Block.MINEABLE,
	/** COAL         */ Block.SOLID | Block.MINEABLE,
	/** IRON         */ Block.SOLID | Block.MINEABLE,
	/** GOLD         */ Block.SOLID | Block.MINEABLE,
	/** SAPPHIRE     */ Block.SOLID | Block.MINEABLE,
	/** EMERALD      */ Block.SOLID | Block.MINEABLE,
	/** RUBY         */ Block.SOLID | Block.MINEABLE,
	/** DIAMOND      */ Block.SOLID | Block.MINEABLE,
	/** POUDRETTEITE */ Block.SOLID | Block.MINEABLE,
];

Block.ATLAS_SIZE = 128;
Block.TILE_SIZE = 16;
Block.UV_UNIT = Block.TILE_SIZE / Block.ATLAS_SIZE;

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
		return Block.ATLAS[5];
	} else if (blockType === Block.COAL) {
		if (face === 2) {
			return Block.ATLAS[2];
		} else if (face === 3) {
			return Block.ATLAS[0];
		} else {
			return Block.ATLAS[1];
		}
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
