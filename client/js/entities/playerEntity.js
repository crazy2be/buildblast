define(function (require) {
	var THREE = require("THREE");
	var PLAYER = require("player/playerSize");
	var EntityState = require("./entityState");

	var PlayerMeshObj = require("./UIViews/playerMeshObj");
	var HpBarObj = require("./UIViews/hpBarObj");

	return function PlayerEntity(id) {
		var self = this;

		self.id = function () {
			return id;
		};

		self.pos = function () {
			return state.pos;
		};

		self.look = function () {
			return state.look;
		};

		self.health = function () {
			return state.health;
		};

		self.maxHealth = function () {
			return state.maxHealth;
		};

		self.vy = function () {
			return state.vy;
		};

		self.rotation = function () {
			return entityMesh.rotation;
		};

		self.contains = function (x, y, z) {
			var box = new Box(pos, PLAYER.HALF_EXTENTS, PLAYER.CENTER_OFFSET);
			return box.contains(x, y, z);
		};

		self.addTo = function (scene) {
			scene.add(entityMesh);

			uIViews.forEach(function (view) {
				if (view.fixToPlayer && !view.fixToPlayer()) {
					view.meshes().forEach(scene.add.bind(scene));
				}
			});
		};

		self.removeFrom = function (scene) {
			scene.remove(entityMesh);

			uIViews.forEach(function (view) {
				if (view.fixToPlayer && !view.fixToPlayer()) {
					view.meshes().forEach(scene.remove.bind(scene));
				}
			});
		};

		//You MUST add all your views before you are added to the scene!
		var uIViews = [];
		self.add = function (view) {
			uIViews.push(view);
			if (!view.fixToPlayer || view.fixToPlayer()) {
				view.meshes().forEach(entityMesh.add.bind(entityMesh));
			}
		}
		//Inits the regular views, some stuff can't go in here
		//(EntityBar) as it needs access to stuff an entity really should not have.
		self.initViews = function (cameraPosFnc) {
			self.add(new PlayerMeshObj());
			if (localStorage.hpBars) {
				self.add(new HpBarObj());
			}
			return self;
		}

		var state = new EntityState();

		var entityMesh = new THREE.Object3D();

		var throttle = 0;
		self.update = function (newState, clock, viewFacingPos) {
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
				uIViews[i].update(self, clock, viewFacingPos);
			}
		}
	}
});
