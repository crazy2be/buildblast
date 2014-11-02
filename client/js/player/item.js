define(function(require) {
var THREE = require("THREE");

var Models = require("models");
var Block = require("chunks/block");
var BlockGeometry = require("chunks/geometry");
var BlockMesh = require("meshes/blockMesh");

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
};

Item.realInit = function () {
	Item.DATA =  [
		{
			name: '',
			model: null,
			action: null,
			icon: 0
		},
		block('dirt', Block.DIRT, 1),
		block('stone', Block.STONE, 2),
		{
			name: 'shovel',
			model: Models.shovel(),
			action: throttle(shovelAction),
			icon: 3
		},{
			name: 'pistol',
			model: Models.pistol(),
			//This action does nothing, we send the server our controls every
			//tick and that's how we shoot.
			action: function () {},
			icon: 4
		},
		block('spawn', Block.SPAWN, 5),
		block('grass', Block.GRASS, 6),
		block('coal', Block.COAL, 7),
		block('iron', Block.IRON, 8),
		block('gold', Block.GOLD, 9),
		block('sapphire', Block.SAPPHIRE, 10),
		block('emerald', Block.EMERALD, 11),
		block('ruby', Block.RUBY, 12),
		block('diamond', Block.DIAMOND, 13),
		block('poudretteite', Block.POUDRETTEITE, 14),
		block('glass', Block.GLASS, 15),
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

	function block(name, id, icon) {
		return {
			name: name,
			model: blockModel(id),
			action: throttle(blockAction(id)),
			stackable: true,
			icon: icon
		};
	}

	function blockAction(block) {
		return function (world, camera) {
			var bc = world.findLookedAtBlock(camera, true);
			if (!bc) return;
			world.changeBlock(bc.x, bc.y, bc.z, block);
		};
	}

	function blockModel(blockType) {
		var geometry = new BlockGeometry();
		var position = [-0.5, -0.5, -0.5];
		var shownFaces = [1, 1, 1, 1, 1, 1];
		geometry.add(blockType, position, shownFaces);
		return new BlockMesh(geometry.finish());
	}
};

return Item;

});
