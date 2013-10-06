function EntityNetworkController(entity, clock, initialState) {
	var self = this;
	var history = new HistoryBuffer();
	history.add(initialState.time, initialState.data);

	self.update = function () {
		entity.update(history.at(clock.entityTime()), clock);
	};

	self.message = function (data) {
		history.add(data.time, data.data);
	};

	self.entity = function () {
		return entity;
	};

	self.drawState = history.drawState;
}

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
		var ep = entity.pos();
		var pp = playerEntity.pos();
		mesh.rotation.y = Math.atan2(pp.x - ep.x, pp.z - ep.z);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawFunc(ctx, clock.entityTime(), canvas.width, canvas.height);
		texture.needsUpdate = true;
	};

	self.mesh = function () {
		return mesh;
	};
}
