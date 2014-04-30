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

Item.NIL          = 0;
Item.DIRT         = 1;
Item.STONE        = 2;
Item.SHOVEL       = 3;
Item.GUN          = 4;
Item.SPAWN        = 5;
Item.GRASS        = 6;
Item.COAL         = 7;
Item.IRON         = 8;
Item.GOLD         = 9;
Item.SAPPHIRE     = 10;
Item.EMERALD      = 11;
Item.RUBY         = 12;
Item.DIAMOND      = 13;
Item.POUDRETTEITE = 14;
Item.GLASS        = 15;

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
	},{
		name: 'spawn',
		model: blockModel(Block.SPAWN),
		action: throttle(blockAction(Block.SPAWN)),
		stackable: false,
		icon: 5,
	},{
		name: 'grass',
		model: blockModel(Block.GRASS),
		action: throttle(blockAction(Block.GRASS)),
		stackable: true,
		icon: 6,
	},{
		name: 'coal',
		model: blockModel(Block.COAL),
		action: throttle(blockAction(Block.COAL)),
		stackable: true,
		icon: 7,
	},{
		name: 'iron',
		model: blockModel(Block.IRON),
		action: throttle(blockAction(Block.IRON)),
		stackable: true,
		icon: 8,
	},{
		name: 'gold',
		model: blockModel(Block.GOLD),
		action: throttle(blockAction(Block.GOLD)),
		stackable: true,
		icon: 9,
	},{
		name: 'sapphire',
		model: blockModel(Block.SAPPHIRE),
		action: throttle(blockAction(Block.SAPPHIRE)),
		stackable: true,
		icon: 10,
	},{
		name: 'emerald',
		model: blockModel(Block.EMERALD),
		action: throttle(blockAction(Block.EMERALD)),
		stackable: true,
		icon: 11,
	},{
		name: 'ruby',
		model: blockModel(Block.RUBY),
		action: throttle(blockAction(Block.RUBY)),
		stackable: true,
		icon: 12,
	},{
		name: 'diamond',
		model: blockModel(Block.DIAMOND),
		action: throttle(blockAction(Block.DIAMOND)),
		stackable: true,
		icon: 13,
	},{
		name: 'poudretteite',
		model: blockModel(Block.POUDRETTEITE),
		action: throttle(blockAction(Block.POUDRETTEITE)),
		stackable: true,
		icon: 14,
	},{
		name: 'glass',
		model: blockModel(Block.GLASS),
		action: throttle(blockAction(Block.GLASS)),
		stackable: true,
		icon: 15,
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
