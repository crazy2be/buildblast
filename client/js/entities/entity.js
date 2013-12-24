define(function(require) {
var EntityState = require("./entityState");
var EntityBar = require("./UIViews/entityBar");

// he: HALF_EXTENTS, co: CENTER_OFFSET
return function Entity(id, he, co) {
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
	self.contains = function (x, y, z) {
		var box = new Box(state.pos, he, co);
		return box.contains(x, y, z);
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
		mesh.position.copy(state.pos.clone().add(co));
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
		self.add(new HitboxMesh(he));
		self.add(new EntityBar(drawID));
	}
	init();
};

// he: HALF_EXTENTS
function HitboxMesh(he) {
	var self = this;

	var material = new THREE.MeshBasicMaterial({
		color: 0x000000,
		wireframe: true
	});

	var geometry = new THREE.CubeGeometry(he.x * 2, he.y * 2, he.z * 2);
	var mesh = new THREE.Mesh(geometry, material);

	self.mesh = function () {
		return mesh;
	};

	self.update = function () {};
}
});
