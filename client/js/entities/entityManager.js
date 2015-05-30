define(function (require) {

var Protocol = require("core/protocol");
var Biotic = require("./biotic");
var WorldItem = require("./worldItem");
var EntityLagInducer = require("./entityLagInducer");
var EntityBar = require("meshes/entityBar");
var PlayerMesh = require("meshes/playerMesh");
var WorldItemMesh = require("meshes/worldItemMesh");

var EntityKindPlayer = "player";
var EntityKindWorldItem = "worldItem";

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

	function stateToHistoryState(kind, state) {
		var result = { time: null, data: null };
		if (kind === EntityKindPlayer || kind == EntityKindWorldItem) {
			result.time = state.entityState.lastUpdated;
			result.data = state;
		} else {
			return null;
		}
		return result;
	}

	function unmarshalState(offset, dataView, kind) {
		var stateResult;
		if (kind === EntityKindPlayer) {
			stateResult = Protocol.unmarshalBioticState(offset, dataView);
		} else if (kind === EntityKindWorldItem) {
			stateResult = Protocol.unmarshalWorldItemState(offset, dataView);
		}
		return stateResult;
	}

	conn.on(Protocol.MSG_ENTITY_CREATE, function(dataView) {
		var offset = 1;
		var idResult = Protocol.unmarshalString(offset, dataView);
		var id = idResult.value;
		offset += idResult.read;
		var kindResult = Protocl.unmarshalString(offset, dataView);
		var kind = kindResult.value;
		offset += kindResult.read;

		if (controllers[id]) {
			console.warn("Got an entity create message for entity which already exists!", id);
			return;
		}

		var stateResult = unmarshalState(offset, dataView, kind);
		console.log("OnCreate", stateResult);
		var entity;
		if (kind === EntityKindPlayer) {
			entity = new Biotic(stateResult.value);
			entity.add(new PlayerMesh());
		} else if (kind === EntityKindWorldItem) {
			entity = new WorldItem(stateResult.value);
			entity.add(new WorldItemMesh(entity.kind(), entity.halfExtents()));
		}
		offset += stateResult.read;
		entity.addTo(scene);

		var initialState = stateToHistoryState(kind, stateResult.value);
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
		var offset = 1;
		var idResult = Protocol.unmarshalString(offset, dataView);
		var id = idResult.value;
		offset += idResult.read;
		var controller = controllers[id];
		if (!controller) {
			console.warn("Got biotic state message for biotic which does not exist!", id);
			return;
		}
		var kindResult = Protocol.unmarshalString(offset, dataView);
		var kind = kindResult.value;
		offset += kindResult.read;
		var stateResult = unmarshalState(offset, dataView, kind);
		controller.message(stateToHistoryState(kind, stateResult.value));
	});

	conn.on(Protocol.MSG_ENTITY_REMOVE, function(dataView) {
		var idResult = Protocol.unmarshalString(1, dataView);
		var id = idResult.value;
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

EntityManager.createPlayerEntity = function(offset, dataView) {
	var result = Protocol.unmarshalBioticState(offset, dataView);
	return { value: new Biotic(result.value), read: result.read }
};

return EntityManager;
});
