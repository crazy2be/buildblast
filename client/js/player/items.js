function Item(type) {
    this.type = type;
    this.model = Item.DATA[this.type].model();
}

Item.prototype.stackable = function () {
    return Item.isStackable(this.type);
};

Item.prototype.name = function () {
    return Item.DATA[this.type].name;
};

Item.prototype.action = function () {
    return Item.DATA[this.type].action;
};

Item.prototype.icon = function () {
    return Item.DATA[this.type].icon;
};

Item.NIL    = function () { return new Item(0x0); };
Item.DIRT   = function () { return new Item(0x1); };
Item.STONE  = function () { return new Item(0x2); };
Item.SHOVEL = function () { return new Item(0x3); };
Item.GUN    = function () { return new Item(0x4); };

// Item properties
Item.STACKABLE = 0x1;

Item.PROPERTIES = [
    /** NIL    */ 0,
    /** DIRT   */ Item.STACKABLE,
    /** STONE  */ Item.STACKABLE,
    /** SHOVEL */ 0,
    /** GUN    */ 0,
];

Item.isStackable = function (item) {
    return Item.hasProperty(item, Item.STACKABLE);
};

Item.hasProperty = function (item, prop) {
    return (Item.PROPERTIES[block] & prop) > 0;
};

Item.throttle = function (func, param) {
    var t = Date.now();
    return function (world, camera) {
        var t2 = Date.now();
        if (t2 - t > 200) {
            func(world, camera, param);
            t = t2;
        }
    };
};

Item.pistolAction = function (world, camera) {
    var intersect = world.findPlayerIntersection(camera);
    if (intersect) {
        console.log("Hit!!", intersect, intersect.item);
    } else {
        console.log("miss!!");
    }
};

Item.shovelAction = function (world, camera) {
    world.removeLookedAtBlock(camera);
};

Item.blockAction = function (world, camera, block) {
    world.addLookedAtBlock(camera, block);
};

Item.DATA = [
    {
        name: '',
        model: function () { return null; },
        action: null,
        icon: '/img/item_icons/nil.png',
    },{
        name: 'dirt',
        model: function () { return Models.block(); },
        action: Item.throttle(Item.blockAction, Block.DIRT),
        icon: '/img/item_icons/dirt.png',
    },{
        name: 'stone',
        model: function () { return Models.stone(); },
        action: Item.throttle(Item.blockAction, Block.STONE),
        icon: '/img/item_icons/stone.png',
    },{
        name: 'shovel',
        model: function () { return Models.shovel(); },
        action: Item.throttle(Item.shovelAction),
        icon: '/img/item_icons/shovel.png',
    },{
        name: 'pistol',
        model: function () { return Models.pistol(); },
        action: Item.pistolAction,
        icon: '/img/item_icons/pistol.png',
    }
];