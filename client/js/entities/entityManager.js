function EntityManager(scene, conn, world, clock) {
	var self = this;

	var entities = {};

	conn.on('entity-pos', function (payload) {
		var id = payload.ID;
		var entity = entities[id];
		if (!entity) {
			console.warn("Got entity-pos message for entity which does not exist!", id);
			return;
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
		//TODO: Use HP timestamps to make HP buffer
		entity.setHealth(payload.Hp);
	});

	conn.on('entity-create', function (payload) {
		var id = payload.ID;
		if (entities[id]) {
			console.warn("Got entity-create message for entity which already exists!", id);
			return;
		}
		var entity = new Entity(id, world, clock, scene).initPlugins();
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

	self.getEntity = function(id) {
		return entities[id];
	}
}
