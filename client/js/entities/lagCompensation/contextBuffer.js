//A wrapper for HistoryBuffer which adds context to values,
//	and so understands the idea of confirmed and unconfirmed messages.
//	This allows it to take functions for interpolate and it will apply
//	the functions with the correct context. It still has no understanding
//	of what it is interpolating though.

//predictFnc(prevData, auxData, dt)
function ContextBuffer(predictFnc) {
	var self = this;

	//TODO: Sync these values (or more or less?) with the server
	//We consider any position with no auxData to be "confirmed"
	var dataHistory = new HistoryBuffer(1000);
	//Every aux should have a datum, but not necessarily the otherway around.
	var auxDataHistory = new HistoryBuffer(1000);

	//We could look this up, but it is easier to just store it.
	var lastConfirmed = 0;

	self.addPrediction = function (time, auxData) {
		var indexBefore = dataHistory.getIndexBefore(time);
		//Cannot predict with no data.
		if (indexBefore === null) return;

		var prevTime = dataHistory.historyTimes[indexBefore];

		var prevData = dataHistory.historyValues[indexBefore];
		var dt = time - prevTime;

		var newDatum = predictFnc(prevData, auxData, dt);

		dataHistory.setValue(time, newDatum);
		auxDataHistory.setValue(time, auxData);
	};

	//Also recalculates the predictions for every aux data after this time, and
	//removes the aux data associated with this time.
	self.addConfirmed = function (time, pos) {
		lastConfirmed = Math.max(lastConfirmed, time);

		var dataIndex = dataHistory.setValue(time, pos);

		var curAuxIndex = auxDataHistory.getIndexOf(time);
		if (curAuxIndex !== null) {
			auxDataHistory.removeAtIndex(curAuxIndex);
		}

		curAuxIndex = auxDataHistory.getIndexAfter(time);

		//No aux indexes to simulate
		if (curAuxIndex === null) return;

		while (curAuxIndex <= auxDataHistory.lastPos()) {
			var auxTime = auxDataHistory.historyTimes[curAuxIndex];
			var auxData = auxDataHistory.historyValues[curAuxIndex];

			//We want to give this aux the more recent prevData,
			//which may not be our confirmed (this could happen
			//if they give confirmed out of order).
			while (dataIndex < dataHistory.lastPos() &&
					dataHistory.historyTimes[dataIndex + 1] < auxTime) {
				dataIndex++;
			}

			var prevTime = dataHistory.historyTimes[dataIndex];
			var prevDatum = dataHistory.historyValues[dataIndex];

			var dt = auxTime - prevTime;

			var predictedDatum = predictFnc(prevDatum, auxData, dt);
			dataHistory.setValue(auxTime, predictedDatum);
			curAuxIndex++;
		}
	};

	self.getLastValue = function () {
		return dataHistory.historyValues[dataHistory.lastPos()];
	};

	self.getValueAt = function (time) {
		//TODO: Interpolation
		return dataHistory.getValue(time);
	};

	self.lastConfirmedTime = function () {
		return lastConfirmed;
	};

	self.firstTime = function () {
		if (dataHistory.lastPos === -1) return 0;

		return dataHistory.historyTimes[0];
	};
	self.lastTime = function () {
		if (dataHistory.lastPos === -1) return 0;

		return dataHistory.historyTimes[dataHistory.lastPos];
	}

	if (localStorage.debug) {
		//Only use these for debugging!
		self.dataTimes = function () {
			return dataHistory.historyTimes;
		};

		self.auxDataTimes = function () {
			return auxDataHistory.historyTimes;
		};
	}
}