define(function(require) {
var THREE = require("THREE");

var Models = require("models");
var Block = require("chunks/block");
var Chunk = require("chunks/chunk");

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

Item.prototype.model = function () {
	Item.init();
	var model = Item.DATA[this.type].model;
	return model ? model.clone() : null;
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
		model: blockModel(Block.DIRT),
		action: throttle(blockAction(Block.DIRT)),
		stackable: true,
		icon: 1,
	},{
		name: 'stone',
		model: blockModel(Block.STONE),
		action: throttle(blockAction(Block.STONE)),
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
		//This action does nothing, we send the server our controls every
		//tick and that's how we shoot.
		action: function () {},
		icon: 4,
	}
	];

	function throttle(func) {
		var t = Date.now();
		return function (world, camera) {
			var t2 = Date.now();
			if (t2 - t > 200) {
				func(world, camera);
				t = t2;
			}
		};
	}

	function shovelAction(world, camera) {
		var bc = world.findLookedAtBlock(camera);
		if (!bc) return;
		var block = world.blockAt(bc.x, bc.y, bc.z);
		if (!block || !block.mineable()) {
			return;
		}
		world.changeBlock(bc.x, bc.y, bc.z, Block.AIR);
	}

	function superShovelAction(world, camera) {
		var center = world.findLookedAtBlock(camera);
		for (var x = 0; x < 10; x++) {
			for (var y = 0; y < 10; y++) {
				for (var z = 0; z < 10; z++) {
					world.changeBlock(center.x + x, center.y + y, center.z + z, Block.AIR);
				}
			}
		}
	}

	function blockAction(block) {
		return function (world, camera) {
			var bc = world.findLookedAtBlock(camera, true);
			if (!bc) return;
			world.changeBlock(bc.x, bc.y, bc.z, block);
		};
	}

	function blockModel(block) {
		var verts = [];
		var indices = [];
		var uvs = [];
		var shownFaces = [1, 1, 1, 1, 1, 1];
		var position = [-0.5, -0.5, -0.5];
		Block.addGeometry(verts, indices, uvs, shownFaces, block, position);

		var attributes = Block.makeAttributes(verts, indices, uvs);
		var offsets = Block.makeOffsets(indices);

		var geometry = new THREE.BufferGeometry();
		geometry.attributes = attributes;
		geometry.offsets = offsets;
		return Chunk.makeBlockMesh(block, geometry);
	}
}

return Item;
});
