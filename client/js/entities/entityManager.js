function EntityManager(scene, conn, world, clock) {
	var self = this;

	var entities = {};

	var _playerId = null;
	//This is only for the player which represents the player!
	self.addUserPlayer = function(player) {
		_playerId = player.id();
		entities[player.id()] = player;
	};

	conn.on('entity-pos', function (payload) {
		var id = payload.ID;
		var entity = entities[id];
		if (!entity) {
			console.warn("Got entity-pos message for entity which does not exist!", id);
			return;
		}

		if (id !== _playerId) {
			debugger;
		}

		entity.posMessage(payload);
	});

	//entity-hp
	conn.on('entity-hp', function (payload) {
		var id = payload.ID;
		var entity = entities[id];
		if (!entity) {
			console.warn("Got entity-hp message for entity which does not exist!", id);
			return;
		}
		entity.setHealth(payload.Hp);
	});

	conn.on('entity-create', function (payload) {
		var id = payload.ID;
		if (entities[id]) {
			//This is good, confirms that the server recognizes our existence
			if (id === _playerId) return;
			console.warn("Got entity-create message for entity which already exists!", id);
			return;
		}
		var entity = new Entity(id, world, clock, scene).initViews();
		entity.addToScene();
		entities[id] = entity;
	});

	conn.on('entity-remove', function (payload) {
		var id = payload.ID;
		var entity = entities[id];
		if (!entity) {
			console.warn("Got entity-remove message for entity which does not exist: ", id);
		}
		entity.removeFromScene();
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
			var entity = entities[id];
			entity.update(dt, playerPos);
		}
	};
}
