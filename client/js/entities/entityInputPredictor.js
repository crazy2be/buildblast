define(function (require) {

var BioticState = require("./model/bioticState");

// This is only valid for BioticStates
function PredictionBuffer(predictor) {
	var self = this;
	var times = [];
	var predictions = [];
	var controlStates = [];
	var confirmed = {
		time: 0,
		state: new BioticState()
	};
	var len = 0;
	var maxLen = 100;

	self.add = function (t, controlState) {
		var lastT = len > 0 ? times[len - 1] : confirmed.time;
		var dt = t - lastT;
		if (dt != dt) debugger;
		if (dt <= 0) {
			throw "Attempted to add prediction in the past at t = " +
				t + ", newest prediction is at " + times[len - 1];
		}

		var lastState = len > 0 ? predictions[len - 1] : confirmed.state;
		var prediction = predictor(lastState, controlState, dt);

		times.push(t);
		controlStates.push(controlState);
		predictions.push(prediction);
		len++;

		return prediction;
	};

	function findIndex(t) {
		for (var i = 0; i < times.length; i++) {
			if (times[i] === t) return i;
		}
		return -1;
	}

	function repredictAll() {
		var prev_t = confirmed.time;
		var state = confirmed.state;
		for (var i = 0; i < controlStates.length; i++) {
			var c = controlStates[i];
			var t = times[i];
			var dt = t - prev_t;
			prev_t = t;
			state = predictor(state, c, dt);
			predictions[i] = state;
		}
	}

	self.confirmed = function (t, state) {
		var i = findIndex(t);
		if (i < 0) {
			console.warn("No matching prediction data for prediction given by server. Ignoring. See #147");
			return;
		}

		confirmed.time = t;
		confirmed.state = state;
		var predicted = predictions[i];

		i++;
		times.splice(0, i);
		predictions.splice(0, i);
		controlStates.splice(0, i);
		len -= i;
		if (!predicted.prettyCloseTo(state)) {
			// Oh crap, the server disagreed with us :(
			// We could maybe adjust the player's state/position gradually if
			// it's just off by a little bit, but hopefully this disagreement
			// will happen rarely enough that it's not a huge deal.
			repredictAll();
		}
	};

	self.duration = function () {
		return (times[len - 1] - confirmed.time) || 0.0;
	};
}

return function EntityInputPredictor(entity, predictor) {
	var self = this;
	var buf = new PredictionBuffer(predictor);

	self.update = function () {};

	// We only want to update when playerUI wants
	// us to update, not when the EntityManager does.
	// This lets us ensure we are updated *before* any
	// of the other entities.
	self.realUpdate = function (clock, controls, camera) {
		var latest = buf.add(clock.time(), controls.sample());
		entity.update(latest, clock, camera);
	};

	self.message = function (data) {
		buf.confirmed(data.time, data.data);
	};

	self.entity = function () {
		return entity;
	};

	// How far ahead are we predicting? This is a
	// rough indicator of lag, since it tells us how
	// long it's taking the server to confirm our
	// position.
	self.predictionAheadBy = function () {
		return buf.duration();
	}
}
});
