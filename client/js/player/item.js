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
		action: function(){},
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
		var shownFaces = [1, 1, 1, 1, 1];
		var position = [0.0, 0.0, 0.0];
		Block.addGeometry(verts, indices, uvs, shownFaces, block, position);

		// TODO: Don't just copy all this shit from simpleMesher...
		function copy(src, dst) {
			for (var i = 0; i < src.length; i++) {
				dst[i] = src[i];
			}
		}

		// Here we're just copying the native JavaScript numbers into a typed Float32 array.
		// This is required by WebGL for attribute buffers.
		var vertsa = new Float32Array(verts.length);
		copy(verts, vertsa);

		var indicesa = new Uint16Array(indices.length);
		copy(indices, indicesa);

		var uvsa = new Float32Array(uvs.length);
		copy(uvs, uvsa);

		//See the readme for documentation.
		var attributes = {
			position: {
				itemSize: 3,
				array: vertsa,
				numItems: verts.length,
			},
			index: {
				itemSize: 1,
				array: indicesa,
				numItems: indices.length,
			},
			uv: {
				itemSize: 2,
				array: uvsa,
				numItems: uvsa.length,
			},
		};

		var offsets = [{
			start: 0,
			count: indices.length,
			indices: 0,
		}];
		// END TODO

		var geometry = new THREE.BufferGeometry();
		geometry.attributes = attributes;
		geometry.offsets = offsets;
		return Chunk.makeBlockMesh(block, geometry);
	}
}

return Item;
});
