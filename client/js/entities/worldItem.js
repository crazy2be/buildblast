define(function(require) {

var Debug = require("debug");
var THREE = require("THREE");
var EntityBar = require("meshes/entityBar");
var HitboxMesh = require("meshes/hitboxMesh");
var Box = require("physics/box");

return function WorldItem(worldItemState) {
	var self = this;
	var hitboxMesh;

	self.kind = function() {
		return worldItemState.itemKind;
	};
	self.pos = function() {
		return worldItemState.entityState.body.pos.clone();
	};
	self.look = function () {
		return worldItemState.entityState.body.dir.clone();
	};
	self.halfExtents = function() {
		return worldItemState.entityState.body.halfExtents;
	};
	self.box = function() {
		return new Box(self.halfExtents(),
			worldItemState.entityState.body.centerOffset).setPosition(self.pos());
	};
	self.contains = function(x, y, z) {
		return self.box().contains(x, y, z);
	};

	var mesh = new THREE.Object3D();
	self.addTo = function(scene) {
		scene.add(mesh);
	};
	self.removeFrom = function(scene) {
		scene.remove(mesh);
	};

	var pieces = [];
	self.add = function(view) {
		pieces.push(view);
		mesh.add(view.mesh());
	};
	self.remove = function(view) {
		var index = pieces.indexOf(view);
		if (index > -1) {
			pieces = pieces.splice(index, 1);
		}
		mesh.remove(view.mesh());
	};

	self.update = function(newState, clock, camera) {
		worldItemState = newState;
		mesh.position.copy(worldItemState.entityState.body.pos.clone().add(
			worldItemState.entityState.body.centerOffset));
		for (var i = 0; i < pieces.length; i++) {
			pieces[i].update(self, clock, camera);
		}

		if (Debug.ITEM_MESH) {
			var newHalfExtents = self.halfExtents();
			if (!hitboxMesh.equals(newHalfExtents)) {
				self.remove(hitboxMesh);
				hitboxMesh = new HitboxMesh(newHalfExtents);
				self.add(hitboxMesh);
			}
		}
	};

	function init() {
		function drawID(ctx, w, h) {
			ctx.fillStyle = 'white';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '20px courier';
			ctx.fillText(worldItemState.entityState.entityId, w/2, h/2);
		}

		if (Debug.ITEM_MESH) {
			hitboxMesh = new HitboxMesh(self.halfExtents());
			self.add(hitboxMesh);
			// TODO: Draw item name smaller
			//self.add(new EntityBar(drawID));
		}
	}
	init();
};

});
