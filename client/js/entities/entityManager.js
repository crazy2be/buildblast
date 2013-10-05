function EntityManager(scene, conn, world, clock) {
	var self = this;

	var controllers = {};

	var _playerId = null;
	//This is only for the player which represents the player!
	self.addUserPlayer = function(id, entity, controller) {
		_playerId = id;
		controllers[id] = controller;
		if (localStorage.showOwnEntity || localStorage.thirdPerson) {
			entity.addTo(scene);
		}
	};

	conn.on('entity-create', function (payload) {
		var id = payload.ID;
		if (controllers[id]) {
			//This is good, confirms that the server recognizes our existence
			if (id === _playerId) return;
			console.warn("Got entity-create message for entity which already exists!", id);
			return;
		}
		var entity = new PlayerEntity(id)
		var controller = new EntityNetworkController(entity, clock);
		controller.entity().addTo(scene);
		controllers[id] = controller;
	});

	conn.on('entity-pos', function (payload) {
		var id = payload.ID;
		var controller = controllers[id];
		if (!controller) {
			console.warn("Got entity-pos message for entity which does not exist!", id);
			return;
		}
		function vec(obj) {
			return new THREE.Vector3(obj.X, obj.Y, obj.Z)
		}
		var msg = {
			time: payload.Timestamp,
			data: {
				pos: vec(payload.Pos),
				vy: payload.Vy,
				look: vec(payload.Look),
			},
		};
		controller.message(msg);
	});

	conn.on('entity-remove', function (payload) {
		var id = payload.ID;
		var controller = controllers[id];
		if (!controller) {
			console.warn("Got entity-remove message for entity which does not exist: ", id);
		}
		controller.entity().removeFrom(scene);
		delete controllers[id];
	});

	self.entityAt = function (wcX, wcY, wcZ) {
		for (var id in controllers) {
			var entity = controllers[id].entity();
			if (entity.contains(wcX, wcY, wcZ)) {
				return entity;
			}
		}
	};

	self.update = function() {
		for (var id in controllers) {
			var controller = controllers[id];
			controller.update();
		}
	};
}
