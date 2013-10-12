define(function (require) {
var HistoryBuffer = require("./historyBuffer");

return function EntityLagInducer(entity, clock, initialState) {
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
});
