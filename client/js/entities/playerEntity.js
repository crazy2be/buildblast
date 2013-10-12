define(function (require) {

var THREE = require("THREE");
var PLAYER = require("player/playerSize");
var EntityState = require("./entityState");

return function PlayerEntity() {
	var self = this;

	self.pos = function () {
		return state.pos;
	};

	self.look = function () {
		return state.look;
	};

	self.health = function () {
		return state.health;
	};

	self.vy = function () {
		return state.vy;
	};

	self.contains = function (x, y, z) {
		var box = new Box(pos, PLAYER.HALF_EXTENTS, PLAYER.CENTER_OFFSET);
		return box.contains(x, y, z);
	};

	self.addTo = function (scene) {
		scene.add(entityMesh);
	};

	self.removeFrom = function (scene) {
		scene.remove(entityMesh);
	};

	var uIViews = [];
	self.add = function (view) {
		uIViews.push(view);
		view.meshes().forEach(entityMesh.add.bind(entityMesh));
	}

	var state = new EntityState();

	var entityMesh = new THREE.Object3D();

	self.update = function (newState, clock) {
		state = newState;

		var pos = self.pos();
		var look = self.look();

		var co = PLAYER.CENTER_OFFSET;
		var c = new THREE.Vector3(
			pos.x + co.x,
			pos.y + co.y,
			pos.z + co.z
		);
		entityMesh.position.set(c.x, c.y, c.z);

		function lookAt(obj, pos, x, y, z) {
			var target = new THREE.Vector3(
				pos.x + x,
				pos.y + y,
				pos.z + z
			);
			obj.lookAt(target);
		}
		lookAt(entityMesh, c, look.x, 0, look.z);

		for (var i = 0; i < uIViews.length; i++) {
			uIViews[i].update(self, clock);
		}
	}
}
});
