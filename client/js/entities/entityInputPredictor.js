define(function (require) {
var EntityState = require("./entityState");

function PredictionBuffer(predictor) {
	var self = this;
	var times = [0];
	var predictions = [new EntityState()];
	// controlss because it's a list of controls.
	var controlss = [];

	var len = 1;
	var maxLen = 100;

	self.add = function (t, controls) {
		var dt = t - times[len - 1]
		if (dt <= 0) {
			throw "Attempted to add prediction in the past at t = " +
				t + ", newest prediction is at " + times[len - 1];
		}
		times.push(t);
		controlss.push(controls);
		prediction = predictor(predictions[len - 1], controls, dt);
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

	function repredictAll(start_t, start_state) {
		var prev_t = start_t;
		var state = start_state;
		for (var i = 0; i < controlss.length; i++) {
			var c = controlss[i];
			var t = times[i];
			var dt = t - prev_t;
			prev_t = t;
			state = predictor(state, c, dt);
			predictions[i + 1] = state;
		}
	}

	self.confirmed = function (t, state) {
		var i = findIndex(t);
		if (i < 0) {
			throw "No matching prediction data for prediction given by server.";
		}

		times.splice(0, i + 1);
		predictions.splice(0, i + 1);
		controls = controlss[i];
		controlss.splice(0, i + 1);
		len -= i + 1;

		if (!predictions[0].equals(state)) {
			// Oh crap, the server disagreed with us :(
			// We could maybe adjust the player's state/position gradually if
			// it's just off by a little bit, but hopefully this disagreement
			// will happen rarely enough that it's not a huge deal.
			times.unshift(t);
			predictions.unshift(state);
			len++;
			repredictAll(t, state);
		}
	};

	self.duration = function () {
		return (times[len - 1] - times[0]) || 0.0;
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
		return buf.add(clock.time(), controls);
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
