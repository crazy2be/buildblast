//Stores a history of values (with no context, and no manipulation
//	or understanding of underlying values), allowing you to access
//	the state based on time.
//Is not POD, but I treat it as such because it makes the code much easier.
//	However only really contextBuffer uses this, so the mess shouldn't spread.

//Essentially implements lag compensation.
define(function (require) {

	return function HistoryBuffer(maxHistory) {
		var self = this;

		//Exposing our internals makes people using this a lot more efficient.
		var historyMax = maxHistory - 1;
		var lastPos = -1;
		var historyValues = [];
		var historyTimes = [];

		self.lastPos = function () { return lastPos; }
		self.historyValues = historyValues;
		self.historyTimes = historyTimes;

		self.setMaxHistory = function (newMaxSize) {
			var shiftTarget = historyMax - newMaxSize;
			historyMax = newMaxSize;
			var shiftedCount = 0;
			while (lastPos > historyMax) {
				historyValues.shift();
				historyTimes.shift();
				shiftedCount++;
			}

			if (shiftTarget > 0 && shiftedCount != shiftTarget) {
				//This is bad, I try very hard to keep HistoryBuffer correctly synced without
				//constantly while loops to chuck elements. While HistoryBuffer exposes a lot,
				//it's callers shouldn't mess with it's arrays, so this should never happen.
				console.error("NOOOOO a history buffer got out of sync, this could lead to no data, or infinite data situations.");
			}
		};

		self.setValue = function (time, newValue) {
			if (lastPos == historyMax) {
				//Buffer is full
				//If they set values way in the past, this will "extend" the past,
				//this is okay I guess? But if they start inserting in the future again,
				//their will lose their past values.
				historyValues.shift();
				historyTimes.shift();
				lastPos--;
			}

			var insertIndex = getInsertIndex(time);

			if (insertIndex > lastPos) { //Push to end
				historyTimes.push(time);
				historyValues.push(newValue);
				lastPos++;
				return lastPos - 1;
			}
			else if (historyTimes[insertIndex] == time) { //Replace
				historyTimes[insertIndex] = time;
				historyValues[insertIndex] = newValue;
				return insertIndex;

			} else { //:( have to splice in middle.
				historyTimes.splice(insertIndex, 0, time);
				historyValues.splice(insertIndex, 0, newValue);
				lastPos++;
				return lastPos - 1;
			}
		}

		//If time is < all times, we return the first value,
		//and if it is > all times we return the last value.
		self.getValue = function (time) {
			if (lastPos == -1) return null;

			var insertIndex = getInsertIndex(time);
			if (insertIndex > lastPos) insertIndex = lastPos;
			return historyValues[insertIndex];
		}

		self.getValueExact = function (time) {
			var index = self.getIndexOf(time);
			if (index === null) return null;
			return historyValues[index];
		}

		//Same restrictions as getValue
		//Gets the largest index of a time that is < time, or null
		self.getIndexBefore = function (time) {
			if (lastPos == -1) return null;

			var insertIndex = getInsertIndex(time);
			insertIndex -= 1;

			if (insertIndex < 0) return null;

			if (insertIndex > lastPos) return lastPos;

			//The time actually exists
			if (historyTimes[insertIndex] == time) {
				return insertIndex - 1;
			}

			return insertIndex;
		}

		//Gets the smallest index of a time that is >= time, or null
		self.getIndexAfter = function (time) {
			if (lastPos == -1) return null;

			var insertIndex = getInsertIndex(time);

			//If there is nothing after it we indicate this with null
			if (insertIndex > lastPos) return null;

			return insertIndex;
		}

		self.getIndexOf = function (time) {
			var insertIndex = getInsertIndex(time);
			if (insertIndex > lastPos) return null;
			if (historyTimes[insertIndex] != time) return null;
			return insertIndex;
		}

		self.removeAtIndex = function (index) {
			self.historyValues.splice(index, 1);
			self.historyTimes.splice(index, 1);
			lastPos--;
		}

		function getInsertIndex(time) {
			if (lastPos == -1) return 0;

			var lastTime = historyTimes[lastPos];
			if (time > lastTime) {
				//Adding to the end, very likely
				return lastPos + 1;
			} else if (time == lastTime) {
				return lastPos;
			}

			//Binary search to find the insertion point,
			//might be changed to use a hash map instead
			var minTime = historyTimes[0];
			var minIndex = 0;
			//Max is always > time
			var maxTime = lastTime;
			var maxIndex = lastPos; //We already checked the last one, so it is > time

			return binarySearch(time, minTime, minIndex, maxTime, maxIndex, historyTimes);
		}

		function binarySearch(time, minVal, minIndex, maxVal, maxIndex, array) {
			while (minIndex < maxIndex) {
				var curIndex = ~ ~((minIndex + maxIndex) / 2);
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
});