//Stores a history of Vector3s, and then exposes
//a interpolated Vector3 at any time, or a Vector3 that is
//offset to a given Clock.

//Can also be given uncertain future values, which are
//cleared if they are not confirmed by pos values with an equivalent time.

function Vector3HistoryBuffer(initialPos, initialTime) {
	var self = this;

	//This will probably be a bottleneck
	var historyMax = 30;
	var lastPos = 0;
	var historyValues = [initialPos];
	var historyTimes = [initialTime];

	self.setValue = function(newValue, time) {
		if(lastPos == historyMax) {
			//Buffer is full
			historyValues.shift();
			historyTimes.shift();
			lastPos--;
		}

		var lastTime = historyTimes[lastPos];
		if(time >= lastTime) {
			//Adding to the end, very likely
			historyValues.push(newValue);
			historyTimes.push(time);
			return;
		}

		//Binary search to find the insertion point,
		//might be changed to use a hash map instead
		var minVal = historyTimes[0];
		var minIndex = 0;
		//Max is always > time
		var maxVal = lastTime;
		var maxIndex = lastPos; //We already checked the last one, so it is > time

		while(minIndex < maxIndex) {
			var curIndex = (minIndex + maxIndex) / 2;
			var curVal = historyTimes[curIndex];

			if(curVal < time) {
				minVal = time;
			} else if(curVal > time) {
				maxVal = time;
			} else { //==
				minIndex = curIndex;
				break;
			}
		}

		historyTimes[minIndex] = time;
		historyValues[minIndex] = newValue;
	}

	self.getValue = function(time) {
		if(lastPos == historyMax) {
			//Buffer is full
			historyValues.shift();
			historyTimes.shift();
			lastPos--;
		}

		var lastTime = historyTimes[lastPos];
		if(time >= lastTime) {
			return historyValues[lastPos];
		}

		//Binary search to find the insertion point,
		//might be changed to use a hash map instead
		var minVal = historyTimes[0];
		var minIndex = 0;
		//Max is always > time
		var maxVal = lastTime;
		var maxIndex = lastPos; //We already checked the last one, so it is > time

		while(minIndex < maxIndex) {
			var curIndex = (minIndex + maxIndex) / 2;
			var curVal = historyTimes[curIndex];

			if(curVal < time) {
				minVal = time;
			} else if(curVal > time) {
				maxVal = time;
			} else { //==
				minIndex = curIndex;
				break;
			}
		}

		return historyValues[minIndex]
	}
}