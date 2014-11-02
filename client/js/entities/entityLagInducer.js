define(function (require) {

var HistoryBuffer = require("./historyBuffer");

return function EntityLagInducer(entity, initialState) {
	var self = this;
	var history = new HistoryBuffer();
	history.add(initialState.time, initialState.data);

	self.update = function (clock, camera) {
		var state = history.at(clock.entityTime());
		if (!state) return;
		entity.update(state, clock, camera);
	};

	self.message = function (data) {
		history.add(data.time, data.data);
	};

	self.entity = function () {
		return entity;
	};

	self.drawHistory = history.draw;
}

});
