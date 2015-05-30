define(function (require) {

var Protocol = require("core/protocol");
var Biotic = require("./biotic");
var WorldItem = require("./worldItem");
var EntityLagInducer = require("./entityLagInducer");
var EntityBar = require("meshes/entityBar");
var PlayerMesh = require("meshes/playerMesh");
var WorldItemMesh = require("meshes/worldItemMesh");

function EntityManager(scene, conn, world, clock) {
	var self = this;

	// The network controls the entities, these are just data, and inside the data are the
	// views (which are isolated). They are in a sense, ViewModels :D
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

	function stateToHistoryState(state) {
		return {
			time: state.entityState.lastUpdated,
			data: state
		};
	}

	conn.on(Protocol.MSG_ENTITY_CREATE, function(dataView) {
		var result = Protocol.MsgEntityCreate.fromProto(dataView);
		var id = result.id;
		var kind = result.kind;
		var state = result.state;

		if (controllers[id]) {
			console.warn("Got an entity create message for entity which already exists!", id);
			return;
		}

		var entity;
		if (kind === Protocol.EntityKindPlayer) {
			entity = new Biotic(state);
			entity.add(new PlayerMesh());
		} else if (kind === Protocol.EntityKindWorldItem) {
			entity = new WorldItem(state);
			entity.add(new WorldItemMesh(entity.kind(), entity.halfExtents()));
		}
		entity.addTo(scene);

		var initialState = stateToHistoryState(state);
		if (initialState == null) {
			console.warn("Got entity create message for unrecognized entity kind", kind);
			return;
		}

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

	conn.on(Protocol.MSG_ENTITY_STATE, function(dataView) {
		var result = Protocol.MsgEntityState.fromProto(dataView);
		var id = result.id;
		var state = result.state;

		var controller = controllers[id];
		if (!controller) {
			console.warn("Got biotic state message for biotic which does not exist!", id);
			return;
		}

		controller.message(stateToHistoryState(state));
	});

	conn.on(Protocol.MSG_ENTITY_REMOVE, function(dataView) {
		var result = Protocol.MsgEntityRemove.fromProto(dataView);
		var id = result.id;
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

return EntityManager;
});
