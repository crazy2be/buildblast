define(function (require) {
	var THREE = require("THREE");
	var PLAYER = require("player/playerSize");

	return function PlayerEntity() {
		var self = this;

		self.pos = function () {
			return pos;
		};

		self.health = function () {
			return health;
		}

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

		var UIViews = [];
		self.add = function (view) {
			UIViews.push(view);
			view.meshes().forEach(entityMesh.add.bind(entityMesh));
		}

		var pos = new THREE.Vector3(0, 0, 0);
		var health = 100;

		var entityMesh = new THREE.Object3D();

		self.update = function (state, clock) {
			pos = state.pos;
			var look = state.look;

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

			for (var i = 0; i < UIViews.length; i++) {
				UIViews[i].update(self, clock, state);
			}
		}

		// Utils
		// Clamp n between [a, b]. Behaviour is
		// undefined if a > b.
		function clamp(n, a, b) {
			return n < a ? a : n > b ? b : n;
		}
		// Return the sign of n, -1, 1, or 0.
		function signum(n) {
			return n < 0 ? -1 : n > 0 ? 1 : 0;
		}
	}
});
