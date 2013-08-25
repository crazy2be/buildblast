function Item(type) {
	this.type = type;
}

Item.prototype.stackable = function () {
	Item.init();
	return !!Item.DATA[this.type].stackable;
};

Item.prototype.name = function () {
	Item.init();
	return Item.DATA[this.type].name;
};

Item.prototype.action = function () {
	Item.init();
	return Item.DATA[this.type].action;
};

Item.prototype.icon = function () {
	Item.init();
	return Item.DATA[this.type].icon;
};

// NOTE: This model is shared with all other items
// of this type. You should .clone() it before you add
// it to the world.
Item.prototype.model = function () {
	Item.init();
	return Item.DATA[this.type].model;
};

Item.NIL    = 0x0;
Item.DIRT   = 0x1;
Item.STONE  = 0x2;
Item.SHOVEL = 0x3;
Item.GUN    = 0x4;

Item.init = function () {
	if (Item.initialized) return;
	Item.realInit();
	Item.initialized = true;
}

Item.realInit = function () {
	Item.DATA =  [
	{
		name: '',
		model: null,
		action: null,
		icon: 0,
	},{
		name: 'dirt',
		model: Models.block(),
		action: throttle(blockAction, Block.DIRT),
		stackable: true,
		icon: 1,
	},{
		name: 'stone',
		model: Models.stone(),
		action: throttle(blockAction, Block.STONE),
		stackable: true,
		icon: 2,
	},{
		name: 'shovel',
		model: Models.shovel(),
		action: throttle(shovelAction),
		icon: 3,
	},{
		name: 'pistol',
		model: Models.pistol(),
		action: pistolAction,
		icon: 4,
	}
	];

	function throttle(func, param) {
		var t = Date.now();
		return function (world, camera) {
			var t2 = Date.now();
			if (t2 - t > 200) {
				func(world, camera, param);
				t = t2;
			}
		};
	}

	function pistolAction(world, camera) {
		var intersect = world.findPlayerIntersection(camera);
		if (intersect) {
			console.log("Hit!!", intersect, intersect.item);
		} else {
			console.log("miss!!");
		}
	}

	function shovelAction(world, camera) {
		var bc = world.getLookedAtBlock(camera, true);
		world.changeBlock(bc.x, bc.y, bc.z, Block.AIR);
	}

	function blockAction(world, camera, block) {
        var bc = world.getLookedAtBlock(camera, false);
		world.changeBlock(bc.x, bc.y, bc.z, block);
	}
}