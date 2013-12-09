define(function (require) {
var PlayerEntity = require("./playerEntity");
var EntityState = require("./entityState");
var EntityLagInducer = require("./entityLagInducer");
var EntityBar = require("./UIViews/entityBar");
var PlayerMesh = require("./UIViews/playerMesh");

return function EntityManager(scene, conn, world, clock) {
	var self = this;

	//The network controls the entities, these
	//	are just data, and inside the data are the views (which are isolated).
	//They are in a sense, ViewModels :D
	var controllers = {};

	var _playerId = null;
	var _playerEntity = null;
	self.setPlayer = function(id, entity, controller) {
		if (_playerId) {
			throw "Attempt to set player when player has already been set.";
		}
		_playerId = id;
		_playerEntity = entity;
		controllers[id] = controller;
		if (localStorage.showOwnEntity || localStorage.thirdPerson) {
			entity.addTo(scene);
		}
	};

	conn.on('entity-create', function (payload) {
		var id = payload.ID;
		if (controllers[id]) {
			console.warn("Got entity-create message for entity which already exists!", id);
			return;
		}
		var entity = new PlayerEntity(id);
		entity.addTo(scene);

		var initialState = protocolToLocal(payload);
		var controller = new EntityLagInducer(entity, initialState);

		controllers[id] = controller;

		if (localStorage.showHistoryBuffers) {
			var drawHistory = function (ctx, w, h) {
				controller.drawHistory(ctx, w, h, clock.entityTime());
			};
			var historyBar = new EntityBar(drawHistory);
			historyBar.setOffset(0.3);
			entity.add(historyBar);
		}
	});

	function protocolToLocal(payload) {
		function vec(obj) {
			return new THREE.Vector3(obj.X, obj.Y, obj.Z)
		}
		return {
			time: payload.Timestamp,
			data: new EntityState(
				vec(payload.Pos),
				vec(payload.Look),
				payload.Health,
				payload.Vy),
		};
	}

	conn.on('entity-state', function (payload) {
		var id = payload.ID;
		var controller = controllers[id];
		if (!controller) {
			console.warn("Got entity-pos message for entity which does not exist!", id);
			return;
		}

		controller.message(protocolToLocal(payload));
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
			// PlayerEntity has a look and position, which
			// corresponds to the camera look and position,
			// so we can just pass it as the camera.
			var camera = _playerEntity;
			controller.update(clock, camera);
		}
	};
}
});
