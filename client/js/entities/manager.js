function EntityManager(scene, conn, player) {
	var self = this;

	var entities = {};

	conn.on('entity-create', function (payload) {
		var id = payload.ID;
		if (id == player.id()) return;
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
		if (id == player.id()) return;
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
		entity.setRot(new THREE.Vector3(
			payload.Rot.X,
			payload.Rot.Y,
			payload.Rot.Z
		));
	});

	conn.on('entity-remove', function (payload) {
		var id = payload.ID;
		if (id == player.id()) return;
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
	};
}
