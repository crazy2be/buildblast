//function predictFnc(lastDatum, auxData, dt) : newDatum

function PredictionBuffer(predictFnc) {
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
		var dataIndex = dataHistory.setValue(time, pos)

		var curAuxData = auxDataHistory.getIndexOf(time);
		if (curAuxData !== null) {
			auxDataHistory.removeAtIndex(nextAuxIndex);
		}

		var nextAuxIndex = auxDataHistory.getIndexAfter(time);

		//No aux indexes to simulate
		if (nextAuxIndex === null) return;

		while (nextAuxIndex <= auxDataHistory.lastPos()) {
			var auxTime = auxDataHistory.historyTimes[nextAuxIndex];
			var auxData = auxDataHistory.historyValues[nextAuxIndex];

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
			dataIndex++;
			nextAuxIndex++;
		}
	};

	self.getLastValue = function () {
		return dataHistory.historyValues[dataHistory.lastPos()];
	};
}