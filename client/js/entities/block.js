function Block(type) {
    var self = this;
    self.type = type;

    self.getType = function () {
        return self.type;
    }

    self.setType = function (newType) {
        self.type = newType;
    }

    self.isType = function (type) {
        return self.type == type;
    }

    self.mineable = function () {
        return Block.isMineable(self.type);
    }

    self.trans = function () {
        return Block.isTransparent(self.type);
    }

    self.solid = function () {
        return Block.isSolid(self.type);
    }
}

Block.AIR   = 0x1;
Block.DIRT  = 0x2;
Block.STONE = 0x3;

//See "Block encoding.txt"

//Block properties
Block.MINEABLE    = 0x80000000;

//Subtypes
Block.TRANSPARENT = 0x1;
Block.SOLID       = 0x2;

Block.PROPERTIES = [
    /** NIL    */ 0,
    /** AIR    */ Block.TRANSPARENT,
    /** DIRT   */ Block.SOLID | Block.MINEABLE,
    /** STONE  */ Block.SOLID | Block.MINEABLE,
];

Block.isMineable = function (block) {
    return (Block.PROPERTIES[block] & Block.MINEABLE) !== 0;
}

Block.isTransparent = function (block) {
    return Block.inSubtype(block, Block.TRANSPARENT);
}

Block.isSolid = function (block) {
    return Block.inSubtype(block, Block.SOLID);
}

Block.inSubtype = function (block, subtype) {
    return (Block.PROPERTIES[block] & 0xF) == subtype;
}
