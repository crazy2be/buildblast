define(function (require) {

var Protocol = require("core/protocol");
var Biotic = require("./biotic");
var EntityState = require("./model/bioticState");
var EntityLagInducer = require("./entityLagInducer");
var EntityBar = require("meshes/entityBar");
var PlayerMesh = require("meshes/playerMesh");

var EntityKindPlayer = "player";
var EntityKindWorldItem = "worldItem";

function EntityManager(scene, conn, world, clock) {
	var self = this;

	/**
	 * The network controls the entities, these are just data, and inside the data are the
	 * views (which are isolated). They are in a sense, ViewModels :D
	 */
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

	function payloadToHistoryState(payload) {
		var kind = payload.Kind;
		var result = { time: null, data: null };
		if (kind == EntityKindPlayer) {
			var bioticState = Protocol.parseBioticState(payload.BioticState);
			result.time = bioticState.entityState.lastUpdated;
			result.data = bioticState;
		}
		return result;
	}

	function createEntity(payload) {
		var id = payload.ID;
		var kind = payload.Kind;

		if (controllers[id]) {
			console.warn("Got an entity create message for entity which already exists!", id);
			return;
		}

		if (kind != EntityKindPlayer) {
			console.warn("Got biotic-create message for unrecognized entity kind", kind);
		}

		var initialState = payloadToHistoryState(payload);
		var entity = new Biotic(initialState.data);

		if (kind === EntityKindPlayer) {
			entity.add(new PlayerMesh());
		}
		entity.addTo(scene);

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
	}

	conn.on('biotic-create', function (payload) {
		createEntity(payload);
	});

	conn.on('biotic-state', function (payload) {
		var id = payload.ID;
		var controller = controllers[id];
		if (!controller) {
			console.warn("Got biotic-state message for biotic which does not exist!", id);
			return;
		}
		controller.message(payloadToHistoryState(payload));
	});

	conn.on('biotic-remove', function (payload) {
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

EntityManager.createPlayerEntity = function(payload) {
	return new Biotic(Protocol.parseBioticState(payload.BioticState));
};

return EntityManager;
});
