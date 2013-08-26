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

//See "Block encoding.txt"

//Block properties
Block.MINEABLE	= 0x80000000;

//Subtypes
Block.INVISIBLE = 0x1; //Essentially means it has no colors, so Block.getColours will fail (and it so it cannot be drawn).
Block.SOLID = 0x2;  //Means it can be collided with, and cannot so entities cannot occupy the same square as it.

Block.PROPERTIES = [
	/** NIL	*/ 0,
	/** AIR	*/ Block.INVISIBLE,
	/** DIRT   */ Block.SOLID | Block.MINEABLE,
	/** STONE  */ Block.SOLID | Block.MINEABLE,
];

Block.getColours = function (blockType, face) {
	var result = {};
	if (blockType === Block.DIRT) {
		if (face === 2) {
			// Top face
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
	} else {
		// TODO: Fix this during the process of killing downscaling.
		throw "I don't know how to render that... TYPE: " + blockType + " FACE: " + face;
	}
	return result;
	function hex(num) {
		return {
			r: (num >> 16) & 0xFF,
			g: (num >> 8)  & 0xFF,
			b:  num		& 0xFF,
		};
	}
};

Block.isMineable = function (block) {
	return (Block.PROPERTIES[block] & Block.MINEABLE) !== 0;
};

//Don't use this, use isVisible (this only exists for legacy reasons).
Block.isInvisible = function (block) {
	return Block.inSubtype(block, Block.INVISIBLE);
};

Block.isSolid = function (block) {
	return Block.inSubtype(block, Block.SOLID);
};

Block.inSubtype = function (block, subtype) {
	return (Block.PROPERTIES[block] & 0xF) === subtype;
};