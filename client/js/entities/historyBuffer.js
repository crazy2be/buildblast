define(function (require) {

	return function HistoryBuffer() {
		var self = this;
		var times = [];
		var datums = [];
		var len = 0;
		var maxLen = 60;
		self.add = function (t, data) {
			if (t < times[len - 1]) {
				console.warn("Not adding old data to history buffer.")
			}
			times.push(t);
			datums.push(data);
			len++;
			if (len > maxLen) {
				times.shift();
				datums.shift();
				len--;
			}
		};
		// Ideally, this should be as similar to the server
		// as possible. That way, where we are displaying
		// the entity is in the same place the server will
		// calculate it as.
		self.at = function (t) /* data */{
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
			for (var i = len - 2; i >= 0; i--) {
				older_i = i;
				if (times[older_i] <= t) break;
				newer_i = older_i;
			}

			var alpha = (t - times[older_i]) / (times[newer_i] - times[older_i]);
			return datums[older_i].clone().lerp(datums[newer_i], alpha);
		};
		// Draw the state of this history buffer to a canvas.
		// Useful for debugging! Green lines correspond to
		// history entries, orange to our current rendering
		// time (well actually whatever time is passed in).
		self.drawState = function (ctx, time, width, height) {
			oldest_t = times[0];
			newest_t = times[len - 1];

			var offset = 0;

			function xat(t) {
				return (
			(t - oldest_t) /
			(newest_t - oldest_t)
			) * width + offset;
			}

			var curTimeWidth = 4;
			var curX = xat(time);
			if (curX < 0) {
				offset = -curX + curTimeWidth / 2;
			} else if (curX > width) {
				offset = width - curX - curTimeWidth / 2;
			}

			ctx.strokeStyle = 'white';
			ctx.fillStyle = 'white';
			ctx.textBaseline = 'middle';
			ctx.font = 'bold 20pt monospace';
			ctx.textAlign = 'left';
			ctx.fillText('-', 0, height / 2);
			ctx.textAlign = 'right';
			ctx.fillText('+', width, height / 2);
			ctx.lineWidth = 1;
			ctx.strokeRect(0, 0, width, height);

			//History buffer times
			ctx.beginPath();
			for (var i = 0; i < len; i++) {
				var x = xat(times[i]);
				var heightMargin = localStorage.hpBars ? 0 : 4;
				ctx.moveTo(x, heightMargin);
				ctx.lineTo(x, height - heightMargin);
			}
			ctx.lineWidth = 1;
			ctx.strokeStyle = "green";
			ctx.stroke();

			//Current time
			ctx.beginPath();
			var x = xat(time);
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.lineWidth = curTimeWidth;
			ctx.strokeStyle = "orange";
			ctx.stroke();

			if (offset !== 0 && !localStorage.hpBars) {
				ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
				ctx.fillRect(0, 0, width, height);
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = 'red';
				var howFarBehind = round(time - newest_t, 2) + 'ms';
				ctx.fillText(howFarBehind, width / 2, height / 2);
			}
			function round(n, places) {
				var mult = Math.pow(10, places);
				return Math.round(n * mult) / mult;
			}
		};
	}
});