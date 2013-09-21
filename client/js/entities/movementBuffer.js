//A wrapper for HistoryBuffer which works with Vector3s
//and context, allowing for value sensitive (interpolation)
//time calculations.

function MovementBuffer(predictFnc) {
	var self = this;

	var dataHistory = new HistoryBuffer(30);
	//Every aux should have a datum, but not necessarily the otherway around.
	var auxDataHistory = new HistoryBuffer(30);

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
	}
}