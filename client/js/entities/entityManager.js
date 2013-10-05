function EntityManager(scene, conn, world, clock) {
	var self = this;

	var entities = {};
	// FIXME: Should be less sloppy about keeping
	// enityControllers up to date.-
	var entityControllers = {};

	var _playerId = null;
	//This is only for the player which represents the player!
	self.addUserPlayer = function(id, entity, controller) {
		_playerId = id;
		entities[id] = entity;
		entityControllers[id] = controller;
	};

	conn.on('entity-create', function (payload) {
		var id = payload.ID;
		if (entities[id]) {
			//This is good, confirms that the server recognizes our existence
			if (id === _playerId) return;
			console.warn("Got entity-create message for entity which already exists!", id);
			return;
		}
		var entity = new PlayerEntity(id)
		var controller = new EntityNetworkController(entity, clock);
		entity.addTo(scene);
		entities[id] = entity;
		entityControllers[id] = controller;
	});

	conn.on('entity-pos', function (payload) {
		var id = payload.ID;
		var controller = entityControllers[id];
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

	// TODO: Kill this on the server too.
// 	conn.on('entity-hp', function (payload) {
// 		var id = payload.ID;
// 		var entity = entities[id];
// 		if (!entity) {
// 			console.warn("Got entity-hp message for entity which does not exist!", id);
// 			return;
// 		}
// 		entity.setHealth(payload.Hp);
// 	});

	conn.on('entity-remove', function (payload) {
		var id = payload.ID;
		var entity = entities[id];
		if (!entity) {
			console.warn("Got entity-remove message for entity which does not exist: ", id);
		}
		entity.removeFrom(scene);
		delete entities[id];
	});

	self.entityAt = function (wcX, wcY, wcZ) {
		for (var id in entities) {
			var entity = entities[id];
			if (entity.contains(wcX, wcY, wcZ)) {
				return entity;
			}
		}
	};

	self.update = function(dt, playerPos) {
		for (var id in entities) {
// 			var entity = entities[id];
			var controller = entityControllers[id];
			controller.update(dt, playerPos);
		}
	};
}
