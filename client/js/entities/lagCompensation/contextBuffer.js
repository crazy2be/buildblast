//A wrapper for HistoryBuffer which adds context to values,
//	and so understands the idea of confirmed and unconfirmed messages.
//	This allows it to take functions for interpolate and it will apply
//	the functions with the correct context. It still has no understanding
//	of what it is interpolating though.

//Essentially implements input compensation.
define(function (require) {
	//Should really be a package... but w/e
	var HistoryBuffer = require("entities/lagCompensation/historyBuffer");

	//predictFnc(prevData, auxData, dt)
	function ContextBuffer(predictFnc, maxHistory) {
		var self = this;

		//QTODO: consider making these values lower than the server for other players, and higher for our player.
		var dataHistory = new HistoryBuffer(maxHistory);
		//Every aux should have a datum, but not necessarily the otherway around.
		var auxDataHistory = new HistoryBuffer(maxHistory);

		//We could look this up, but it is easier to just store it.
		var lastConfirmed = 0;

		self.setMaxHistory = function (maxHistory) {
			dataHistory.setMaxHistory(maxHistory);
			auxDataHistory.setMaxHistory(maxHistory);
		};

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

			var estimatedPos = dataHistory.getValueExact(time);

			var dataIndex = dataHistory.setValue(time, pos);

			var curAuxIndex = auxDataHistory.getIndexOf(time);
			if (curAuxIndex !== null) {
				auxDataHistory.removeAtIndex(curAuxIndex);
			}

			if (estimatedPos
			&& estimatedPos.x == pos.x
			&& estimatedPos.y == pos.y
			&& estimatedPos.z == pos.z) {
				//If our estimated position was correct, there is no need to resimulate!
				return;
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
			var indexOfTime = dataHistory.getIndexOf(time);
			if (indexOfTime !== null) {
				return dataHistory.historyValues[indexOfTime];
			}

			var indexBefore = dataHistory.getIndexBefore(time);

			if (indexBefore === null || indexBefore + 1 > dataHistory.lastPos()) {
				//Just return whatever dataHistory will give us
				return dataHistory.getValue(time);
			}

			var indexAfter = indexBefore + 1;

			return moveSim.interpolatePosState(time, time,
			dataHistory.historyValues[indexBefore],
			dataHistory.historyTimes[indexBefore],
			dataHistory.historyValues[indexAfter],
			dataHistory.historyTimes[indexAfter]
		);
		};

		self.largestConfirmedTime = function () {
			return lastConfirmed;
		};

		self.firstTime = function () {
			if (dataHistory.lastPos() === -1) return 0;

			return dataHistory.historyTimes[0];
		};
		self.lastTime = function () {
			if (dataHistory.lastPos() === -1) return 0;

			return dataHistory.historyTimes[dataHistory.lastPos()];
		};

		self.getVelocity = function (time) {
			var indexOfTime = dataHistory.getIndexAfter(time);
			var prevIndex = dataHistory.getIndexBefore(time);

			if (indexOfTime === null || prevIndex === null) {
				return new THREE.Vector3(0, 0, 0);
			}

			var prevPos = dataHistory.historyValues[prevIndex].pos;
			var prevTime = dataHistory.historyTimes[prevIndex];

			var curPos = dataHistory.historyValues[indexOfTime].pos;
			var curTime = dataHistory.historyTimes[indexOfTime];

			var delta = prevPos.clone().sub(curPos);
			var dt = (curTime - prevTime);
			delta.x /= dt;
			delta.y /= dt;
			delta.z /= dt;

			return delta;
		};

		if (localStorage.posHistoryBar) {
			//Only use these for debugging!
			self.dataTimes = function () {
				return dataHistory.historyTimes;
			};

			self.dataPositions = function () {
				return dataHistory.historyValues;
			};

			self.auxDataTimes = function () {
				return auxDataHistory.historyTimes;
			};
		}
	}
});