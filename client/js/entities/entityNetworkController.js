function EntityNetworkController(entity, clock) {
	var self = this;
	var history = new HistoryBuffer();
	history.add(0, {
		pos: new THREE.DVector3(0, 0, 0),
		look: new THREE.DVector3(0, 0, 0),
		vy: 0.0,
	});

	self.update = function () {
		entity.update(history.at(clock.time()), clock);
	};

	self.message = function (data) {
		history.add(data.time, data.data);
	};
}
