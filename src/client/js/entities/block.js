function Block(type) {
    var self = this;
    var m_type = type;

    self.getType = function() {
        return m_type;
    }

    self.isType = function(type) {
        return m_type == type;
    }
}

Block.AIR = 0x1;
Block.DIRT = 0x2;
