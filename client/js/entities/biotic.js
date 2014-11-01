define(function(require) {

var THREE = require("THREE");
var EntityBar = require("meshes/entityBar");
var HitboxMesh = require("meshes/hitboxMesh");
var Box = require("physics/box");

return function Biotic(bioticState) {
	var self = this;
	var hitboxMesh;

	function compare(left, right) {
		return left.x === right.x && left.y === right.y && left.z === right.z;
	}

	self.pos = function () {
		return bioticState.entityState.body.pos.clone();
	};
	self.look = function () {
		return bioticState.entityState.body.dir.clone();
	};
	self.health = function () {
		return bioticState.health.life;
	};
	self.vy = function () {
		return bioticState.entityState.body.vel.y;
	};
	self.box = function () {
		return new Box(bioticState.entityState.body.halfExtents,
			bioticState.entityState.body.centerOffset).setPosition(self.pos());
	};
	self.contains = function (x, y, z) {
		return self.box().contains(x, y, z);
	};

	var mesh = new THREE.Object3D();
	self.addTo = function (scene) {
		scene.add(mesh);
	};
	self.removeFrom = function (scene) {
		scene.remove(mesh);
	};

	var pieces = [];
	self.add = function (view) {
		pieces.push(view);
		mesh.add(view.mesh());
	};
	self.remove = function (view) {
		var index = pieces.indexOf(view);
		if (index > -1) {
			pieces = pieces.splice(index, 1);
		}
		mesh.remove(view.mesh());
	};

	self.update = function (newState, clock, player) {
		bioticState = newState;
		mesh.position.copy(bioticState.entityState.body.pos.clone().add(
			bioticState.entityState.body.centerOffset));
		for (var i = 0; i < pieces.length; i++) {
			pieces[i].update(self, clock, player);
		}
		var newHalfExtents = bioticState.entityState.body.halfExtents;
		if (!hitboxMesh.equals(newHalfExtents)) {
			self.remove(hitboxMesh);
			hitboxMesh = new HitboxMesh(newHalfExtents);
			self.add(hitboxMesh);
		}
	};

	function init() {
		function drawID(ctx, w, h) {
			ctx.fillStyle = 'white';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '20px courier';
			ctx.fillText(bioticState.entityState.entityId, w/2, h/2);
		}
		hitboxMesh = new HitboxMesh(bioticState.entityState.body.halfExtents);
		self.add(hitboxMesh);
		self.add(new EntityBar(drawID));
	}
	init();
};

});
