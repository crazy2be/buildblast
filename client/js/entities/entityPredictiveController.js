function EntityPredictiveController(entity, clock, controls, predictor) {
	var self = this;
	var controlStates = [];
	var times = [];
	var lastConfirmed = {
		time: 0,
		data: {
			pos: new THREE.DVector3(0, 0, 0),
			look: new THREE.DVector3(0, 0, 0),
			vy: 0.0,
		},
	};

	self.update = function () {
		var latest = predictMovement();
		entity.update(latest, clock);
	};

	self.message = function (data) {
		// FUUUUU QUENTIN I WILL FIND YOU
		if (data.time === 0) return;
		if (times.length < 1) throw "No matching prediction data for given prediction.";
		var time = times.shift();
		var state = controlStates.shift();
		if (time != data.time) {
			return self.message(data);
			// TODO: Handle this more gracefully.
			throw "Recieved player-position packet from server with timestamp that does not match our oldest non-confirmed packet. This means the server is either processing packets out of order, or dropped one.";
		}

		lastConfirmed = data;
	};

	self.entity = function () {
		return entity;
	};

	function predictMovement() {
		var c = controls.sample();
		var t = clock.time();
		controlStates.push(c);
		times.push(t);

		// TODO: Optimize this.
		return predictAll(t)
	}

	function predictAll(t) {
		var prev_t = lastConfirmed.time;
		var state = lastConfirmed.data;
		for (var i = 0; i < controlStates.length; i++) {
			var c = controlStates[i];
			var t = times[i];
			var dt = t - prev_t;
			state = predictor(state, c, dt);
		}
		return state;
	}
}
