function HistoryBuffer() {
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
		return datums[older_i].clone().lerp(
			datums[newer_i],
			(t - times[older_i])/(times[newer_i] - times[older_i]));
	};
	// Draw the state of this history buffer to a canvas.
	// Useful for debugging! Green lines correspond to
	// history entries, orange to our current rendering
	// time (well actually whatever time is passed in).
	self.drawState = function (ctx, time, width, height) {
		oldest_t = times[0];
		newest_t = times[len - 1];
		function xat(t) {
			return (
				(t - oldest_t)/
				(newest_t - oldest_t)
			) * width;
		}

		ctx.strokeStyle = 'white';
		ctx.fillStyle = 'white';
		ctx.textBaseline = 'middle';
		ctx.font = 'bold 20pt monospace';
		ctx.textAlign = 'left';
		ctx.fillText('-', 0, height/2);
		ctx.textAlign = 'right';
		ctx.fillText('+', width, height/2);
		ctx.lineWidth = 1;
		ctx.strokeRect(0, 0, width, height);

		ctx.beginPath();
		for (var i = 0; i < len; i++) {
			var x = xat(times[i]);
			ctx.moveTo(x, 4);
			ctx.lineTo(x, height - 4);
		}
		ctx.lineWidth = 1;
		ctx.strokeStyle = "green";
		ctx.stroke();

		ctx.beginPath();
		var x = xat(time);
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.lineWidth = 4;
		ctx.strokeStyle = "orange";
		ctx.stroke();

		if (x < 0 || x > width) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
			ctx.fillRect(0, 0, width, height);
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'red';
			var howFarBehind = round(time - newest_t, 2) + 'ms';
			ctx.fillText(howFarBehind, width/2, height/2);
		}
		function round(n, places) {
			var mult = Math.pow(10, places);
			return Math.round(n*mult)/mult;
		}
	};
}