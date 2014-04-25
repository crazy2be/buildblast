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

/**
 * Faces:
 * 0 - (+x) Left
 * 1 - (-x) Right
 * 2 - (+y) Top
 * 3 - (-y) Bottom
 * 4 - (+z) Front
 * 5 - (-z) Back
 */
Block.getColours = function (blockType, face) {
	var result = {};
	if (blockType === Block.DIRT) {
		if (face === 2) {
			// http://colorschemedesigner.com/#2Q41R--iOv5vy
			result.light = hex(0x007608);
			result.dark  = hex(0x004E05);
		} else {
			// Dirt color from http://www.colourlovers.com/color/784800/dirt
			result.light = hex(0x784800);
			result.dark  = hex(0x000000);
		}
	} else if (blockType === Block.STONE) {
		result.light = hex(0x5E5E5E);
		result.dark  = hex(0x000000);
	} else if (blockType === Block.SPAWN) {
		result.light = hex(0x0000FF);
		result.dark = hex(0x000000);
	} else {
		throw "I don't know how to render that... TYPE: " + blockType + " FACE: " + face;
	}
	return result;
	function hex(num) {
		return {
			r: (num >> 16) & 0xFF,
			g: (num >> 8)  & 0xFF,
			b:  num        & 0xFF,
		};
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
