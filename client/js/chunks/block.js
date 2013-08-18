function Block(type) {
    this.type = type;
}
Block.prototype.mineable = function () {
    return Block.isMineable(this.type);
};
Block.prototype.empty = function () {
    return Block.isEmpty(this.type);
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
Block.MINEABLE    = 0x80000000;

//Subtypes
Block.EMPTY = 0x1;
Block.SOLID = 0x2;

Block.PROPERTIES = [
    /** NIL    */ 0,
    /** AIR    */ Block.EMPTY,
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
    } else if (blockType === Block.STONE){
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
            b:  num        & 0xFF,
        };
    }
}

Block.isMineable = function (block) {
    return (Block.PROPERTIES[block] & Block.MINEABLE) !== 0;
}

//Maybe isEmpty should be defined in terms of isSolid, or vice versa?
Block.isEmpty = function (block) {
    return Block.inSubtype(block, Block.EMPTY);
}

Block.isSolid = function (block) {
    return Block.inSubtype(block, Block.SOLID);
}

Block.inSubtype = function (block, subtype) {
    return (Block.PROPERTIES[block] & 0xF) === subtype;
}
