// Could be used for various types of bars or canvases
// we want to have in the scene if somebody wants to make
// it generic.
function EntityBar(drawFunc, playerEntity) {
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
	};

	self.mesh = function () {
		return mesh;
	};
}
