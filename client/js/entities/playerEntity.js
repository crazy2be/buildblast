define(function (require) {

var THREE = require("THREE");
var PLAYER = require("player/playerSize");
var EntityState = require("./entityState");
var PlayerMesh = require("./UIViews/playerMesh");
var EntityBar = require("./UIViews/entityBar");

function HitboxMesh() {
	var self = this;

	var material = new THREE.MeshBasicMaterial({
		color: 0x000000,
		wireframe: true
	});
	var he = PLAYER.HALF_EXTENTS;
	var geometry = new THREE.CubeGeometry(he.x * 2, he.y * 2, he.z * 2);
	var mesh = new THREE.Mesh(geometry, material);

	self.mesh = function () {
		return mesh;
	};

	self.update = function () {};
}

return function PlayerEntity(id) {
	var self = this;

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
		var box = new Box(pos, PLAYER.HALF_EXTENTS, PLAYER.CENTER_OFFSET);
		return box.contains(x, y, z);
	};

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
	}

	var state = new EntityState();

	var mesh = new THREE.Object3D();

	self.update = function (newState, clock, player) {
		state = newState;

		var pos = self.pos();

		var co = PLAYER.CENTER_OFFSET;
		var c = new THREE.Vector3(
			pos.x + co.x,
			pos.y + co.y,
			pos.z + co.z
		);
		mesh.position.set(c.x, c.y, c.z);

		for (var i = 0; i < pieces.length; i++) {
			pieces[i].update(self, clock, player);
		}
	};

	function drawID(ctx, w, h) {
		ctx.fillStyle = 'white';
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '20px courier';
		ctx.fillText(id, w/2, h/2);
	}

	function init() {
		self.add(new PlayerMesh());
		self.add(new HitboxMesh());
		self.add(new EntityBar(drawID));
	}
	init();
}
});
