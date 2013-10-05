function HistoryBuffer() {
	var self = this;
	var times = [];
	var datums = [];
	var len = 0;
	self.add = function (t, data) {
		if (t < times[len - 1]) {
			console.warn("Not adding old data to history buffer.")
		}
		times.push(t);
		datums.push(data);
		len++;
		if (len > 100) {
			times.shift();
			datums.shift();
			len--;
		}
	};
	function lerp(a, b, frac) {
		if (typeof a === 'number') {
			return a*(1 - frac) + b*frac;
		} else if (typeof a === 'object') {
			var res = {};
			for (var key in a) {
				if (!a.hasOwnProperty(key)) continue;
				res[key] = lerp(a[key], b[key], frac);
			}
			return res;
		} else {
			throw "I don't know how to lerp that: " + a;
		}
	}
	self.at = function (t) /* data */ {
		if (len <= 0) {
			throw "Attempt to access item in empty history buffer.";
		}
		var newest_t = times[len - 1];
		if (newest_t <= t) {
			return datums[len - 1];
		}

		var oldest_t = times[0];
		if (oldest_t >= t) {
			return datums[0];
		}

		var older_i = len - 1;
		var newer_i = len - 1;
		for (var i = 1; i < len; i++) {
			older_i = i;
			if (times[older_i] <= t) break;
			newer_i = older_i;
		}
		if (times[older_i] === t) {
			return datums[older_i];
		}
		return lerp(
			datums[older_i],
			datums[newer_i],
			(t - times[older_i])/(times[newer_i] - times[older_i]));
	};
}
