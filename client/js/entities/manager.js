function EntityManager(scene, conn) {
	var self = this;

	var entities = {};

	self.update = function (dt) {
		for (var id in entities) entities[id].update(dt);
	};

	conn.on('entity-create', function (payload) {
		var id = payload.ID;
		if (entities[id]) {
			console.warn("Got entity-create message for entity which already exists!", id);
			return;
		}
		var entity = new Entity(id);
		entity.addTo(scene);
		entities[id] = entity;
	});

	conn.on('entity-position', function (payload) {
		var id = payload.ID;
		var entity = entities[id];
		if (!entity) {
			console.warn("Got entity-position message for entity which does not exist!", id);
			return;
		}
		entity.setPos(new THREE.Vector3(
			payload.Pos.X,
			payload.Pos.Y,
			payload.Pos.Z
		));
		entity.setLook(new THREE.Vector3(
			payload.Look.X,
			payload.Look.Y,
			payload.Look.Z
		));
		entity.setVy(payload.Vy);
	});

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
}
