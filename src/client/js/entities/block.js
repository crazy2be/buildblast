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
    
    self.isTrans = function () {
        return self.type == Block.AIR;
    }
}

Block.AIR = 0x1;
Block.DIRT = 0x2;
