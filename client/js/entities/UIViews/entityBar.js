define(function (require) {

var THREE = require("THREE");

// Could be used for various types of bars or canvases
// we want to have in the scene if somebody wants to make
// it generic.
return function EntityBar(drawFunc, playerEntity) {
	var self = this;
	var canvas = document.createElement('canvas');
	canvas.width = 200;
	canvas.height = 30;
	var ctx = canvas.getContext('2d');

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;

	var material = new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.DoubleSide,
	});
	material.transparent = true;

	var mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(canvas.width, canvas.height),
		material);

	mesh.scale.set(1/100, 1/100, 1/100);
	mesh.position.set(0, 1.25, 0);

	self.update = function (entity, clock) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawFunc(ctx, clock.entityTime(), canvas.width, canvas.height);
		texture.needsUpdate = true;

		// FIXME: I'm not sure this is 100% correct looking. We only consider
		// the x and z components of the look vector, we probably have to
		// consider y as well in order to get the bar to always be projected
		// flat (we want it to appear as if the bar itself was drawn in 2d,
		// using the 3d information to affect only size and position (but
		// never rotation)). If you are good at math/rotation, please feel
		// free to fix this.
		var look = playerEntity.look();
		var r = Math.atan2(look.x, look.z) + Math.PI;
		mesh.rotation.y = r;
	};

	self.mesh = function () {
		return mesh;
	};
}
});
