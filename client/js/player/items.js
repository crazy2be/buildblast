function Item(type, num) {
    this.type = type;
    this.num = num;
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
    return (Item.PROPERTIES[item] & prop) > 0;
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
    if(settings.destroyMapOnMine) {
        Item.destroyMapAction(world, camera);
        return;
    }

    var bc = world.getLookedAtBlock(camera, true);
    if(!bc) return;

    var block = world.blockAt(bc.x, bc.y, bc.z);

    //Likely means the chunk has not been loaded.
    if(!block) return;
    if(!block.mineable()) return;

    world.changeBlock(bc.x, bc.y, bc.z, Block.AIR);
};

Item.destroyMapAction = function (world, camera) {
    var bc = world.getLookedAtBlock(camera, true);
    if(!bc) return;

    //If we destroy too many blocks, it will likely cause the server to kick everyone.
    var radius = new THREE.Vector3(5, 5, 5);
    var percent = 0.25;

    LOOP.For3D(bc.sub(radius), radius.add(radius), sometimesMineBlock);

    function sometimesMineBlock(bc) {
        if(Math.random() >= percent) return;

        var block = world.blockAt(bc.x, bc.y, bc.z);

        //Likely means the chunk has not been loaded.
        if(!block) return;
        if(!block.mineable()) return;

        world.changeBlock(bc.x, bc.y, bc.z, Block.AIR);
    }
}

Item.placeAction = function (world, camera, blockType) {
    var bc = world.getLookedAtBlock(camera, false);
    if(!bc) return;

    var block = world.blockAt(bc.x, bc.y, bc.z);

    //Likely means the chunk has not been loaded.
    if(!block) return;
    if(!block.empty()) return;

    world.changeBlock(bc.x, bc.y, bc.z, blockType);
};

Item.DATA = [
    {
        name: '',
        model: function () { return null; },
        action: null,
        icon: 0,
    },{
        name: 'dirt',
        model: function () { return Models.block(); },
        action: Item.throttle(Item.placeAction, Block.DIRT),
        icon: 1,
    },{
        name: 'stone',
        model: function () { return Models.stone(); },
        action: Item.throttle(Item.placeAction, Block.STONE),
        icon: 2,
    },{
        name: 'shovel',
        model: function () { return Models.shovel(); },
        action: Item.throttle(Item.shovelAction),
        icon: 3,
    },{
        name: 'pistol',
        model: function () { return Models.pistol(); },
        action: Item.pistolAction,
        icon: 4,
    }
];