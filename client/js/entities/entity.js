define(function(require) {
var EntityState = require("./entityState");
var EntityBar = require("./UIViews/entityBar");
var Box = require("geom/box");

return function Entity(id, halfExtents, centerOffset) {
	ASSERTD(id, halfExtents, centerOffset);

	var self = this;

	var state = new EntityState();
	self.pos = function () {
		return state.pos.clone();
	};
	self.look = function () {
		return state.look.clone();
	};
	self.health = function () {
		return state.health;
	};
	self.vy = function () {
		return state.vy;
	};
	self.box = function () {
		return new Box(halfExtents, centerOffset).setPosition(self.pos());
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

	self.update = function (newState, clock, player) {
		state = newState;
		mesh.position.copy(state.pos.clone().add(centerOffset));
		for (var i = 0; i < pieces.length; i++) {
			pieces[i].update(self, clock, player);
		}
	};

	function init() {
		function drawID(ctx, w, h) {
			ctx.fillStyle = 'white';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '20px courier';
			ctx.fillText(id, w/2, h/2);
		}
		self.add(new HitboxMesh(halfExtents));
		self.add(new EntityBar(drawID));
	}
	init();
};

function HitboxMesh(halfExtents) {
	var self = this;

	var material = new THREE.MeshBasicMaterial({
		color: 0x000000,
		wireframe: true
	});

	var geometry = new THREE.CubeGeometry(
		halfExtents.x * 2,
		halfExtents.y * 2,
		halfExtents.z * 2);
	var mesh = new THREE.Mesh(geometry, material);

	self.mesh = function () {
		return mesh;
	};

	self.update = function () {};
}

function ASSERTD() {
	var args = [].slice.apply(arguments);
	for (var i = 0; i < args.length; i++) {
		if (args[i] === undefined ||
			args[i] === null) {
				throw "Unexpected undefined!";
		}
	}
}
});
