define(function (require) {
var EntityState = require("./entityState");

return function EntityInputPredicter(entity, clock, controls, predictor) {
	var self = this;
	var controlStates = [];
	var times = [];
	var lastConfirmed = {
		time: 0,
		data: new EntityState(),
	};

	self.update = function () {
		var latest = predictMovement();
		entity.update(latest, clock);
	};

	self.message = function (data) {
		if (times.length < 1) {
			throw "No matching prediction data for prediction given by server.";
		}
		var time = times.shift();
		var state = controlStates.shift();
		if (time != data.time) {
			// Aww yeah, recursive iteration.
			return self.message(data);
		}

		lastConfirmed = data;
	};

	self.entity = function () {
		return entity;
	};

	// How far ahead are we predicting? This is a
	// rough indicator of lag, since it tells us how
	// long it's taking the server to confirm our
	// position.
	self.predictionAheadBy = function () {
		return times[times.length - 1] - lastConfirmed.time;
	}

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
			prev_t = t;
			state = predictor(state, c, dt);
		}
		return state;
	}
}
});
