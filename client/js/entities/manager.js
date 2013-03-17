function EntityManager(scene, conn) {
	var self = this;

	var entities = {};

	conn.on('entity-create', function (payload) {
		var id = payload.id;
		if (entities[id]) {
			console.warn("Got entity-create message for entity which already exists!", id);
			return;
		}
		var entity = new Entity();
		entity.addTo(scene);
		entities[id] = entity;
	});

	conn.on('entity-position', function (payload) {
		var id = payload.id;
		var entity = entities[id];
		if (!entity) {
			console.warn("Got entity-position message for entity which does not exist!", id);
		}
		entity.setPos(payload.pos);
		entity.setRot(payload.rot);
	});

	conn.on('entity-remove', function (payload) {
		var id = payload.id;
		var entity = entities[id];
		if (!entity) {
			console.warn("Got entity-remove message for entity which does not exist: ", id);
		}
		entity.removeFrom(scene);
		delete entities[id];
	});

	self.entityAt = function (wx, wy, wz) {
		for (var id in entities) {
			var entity = entities[id];
			if (entity.contains(wx, wy, wz)) {
				return entity;
			}
		}
	}
}
