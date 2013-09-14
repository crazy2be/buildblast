//Stores a history of Vector3s, and then exposes
//a interpolated Vector3 at any time, or a Vector3 that is
//offset to a given Clock.

//Can also be given uncertain future values, which are
//cleared if they are not confirmed by pos values with an equivalent time.
function historyBuffer(initialPos, initialTime, maxHistory) {
	var self = this;

	//This will probably be a bottleneck
	var historyMax = maxHistory;
	var lastPos = 0;
	var historyValues = [initialPos];
	var historyTimes = [initialTime];

	self.setValue = function (newValue, time) {
		if (lastPos == historyMax) {
			//Buffer is full
			historyValues.shift();
			historyTimes.shift();
			lastPos--;
		}

		var lastTime = historyTimes[lastPos];
		if (time >= lastTime) {
			//Adding to the end, very likely
			historyValues.push(newValue);
			historyTimes.push(time);
			return;
		}

		//Binary search to find the insertion point,
		//might be changed to use a hash map instead
		var minTime = historyTimes[0];
		var minIndex = 0;
		//Max is always > time
		var maxTime = lastTime;
		var maxIndex = lastPos; //We already checked the last one, so it is > time

		var insertIndex = binarySearch(minTime, minIndex, maxTime, maxIndex, historyTimes);

		historyTimes[insertIndex] = time;
		historyValues[insertIndex] = newValue;
	}

	self.getValue = function (time) {
		if (lastPos == historyMax) {
			//Buffer is full
			historyValues.shift();
			historyTimes.shift();
			lastPos--;
		}

		var lastTime = historyTimes[lastPos];
		if (time >= lastTime) {
			return historyValues[lastPos];
		}

		//Binary search to find the insertion point,
		//might be changed to use a hash map instead
		var minVal = historyTimes[0];
		var minIndex = 0;
		//Max is always > time
		var maxVal = lastTime;
		var maxIndex = lastPos; //We already checked the last one, so it is > time

		var index = binarySearch(minTime, minIndex, maxTime, maxIndex, historyTimes);
		if (index > lastPos) index = lastPos;

		return historyValues[index];
	}

	function binarySearch(minVal, minIndex, maxVal, maxIndex, array) {
		while (minIndex < maxIndex) {
			var curIndex = (minIndex + maxIndex) / 2;
			var curVal = array[curIndex];

			if (curVal < time) {
				minVal = time;
				minIndex = curIndex + 1;
			} else if (curVal > time) {
				maxVal = time;
				maxIndex = curIndex;
			} else { //==
				minIndex = curIndex;
				break;
			}
		}

		return minIndex;
	}
}