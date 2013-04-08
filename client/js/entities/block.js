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

Block.getColours = function (blockType, face) {
    if (blockType === Block.DIRT) {
        if (face === 2) {
            // Top face
            return {
                c: hex(0x007608),
                c2: hex(0x004E05),
            };
        } else {
            return {
                c: hex(0x784800),
                c2: hex(0x000000),
            };
        }
    } else if (blockType == blockType){
        return {
            c: hex(0x5E5E5E),
            c2: hex(0x000000),
        };
    } else {
        throw "I don't know how to render that... TYPE: " + blockType + " FACE: " + face;
    }
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

Block.isTransparent = function (block) {
    return Block.inSubtype(block, Block.TRANSPARENT);
}

Block.isSolid = function (block) {
    return Block.inSubtype(block, Block.SOLID);
}

Block.inSubtype = function (block, subtype) {
    return (Block.PROPERTIES[block] & 0xF) == subtype;
}
