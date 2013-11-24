define(function(require) {
	return function PerfChart(opts) {
		var self = this;

		var defaultOpts = {
			title: '',
			maxValue: 200,
			width: 80,
			height: 48,
			fontSize: 9,
			padding: 3,
		};
		opts = opts || {};
		for (var opt in defaultOpts) {
			if (opt in opts) continue;
			else opts[opt] = defaultOpts[opt];
		}

		var dataPoints = [];
		var numDataPoints = opts.width - opts.padding*2;
		for (var i = 0; i < numDataPoints; i++) {
			dataPoints[i] = 0;
		}
		var currentDataPoint = 0;

		self.addDataPoint = function (ms) {
			if (ms > opts.maxValue) {
				drawBackground('red');
			} else {
				drawBackground('#020');
			}
			drawTitle(formatMS(ms) + opts.title);

			dataPoints[currentDataPoint] = ms;
			drawGraph();

			currentDataPoint = (currentDataPoint + 1) % dataPoints.length;
		};

		var canvasWrapper = document.createElement('div');
		
		var canvas = document.createElement('canvas');
		canvas.width = opts.width;
		canvas.height = opts.height;
		
		var titleElem = document.createElement('div');
		titleElem.textContent = "{Title}";
		
		canvasWrapper.appendChild(titleElem);
		canvasWrapper.appendChild(canvas);
		
		self.elm = canvasWrapper;

		var c = canvas.getContext('2d');
		function drawBackground(color) {
			c.fillStyle = color;
			c.fillRect(0, 0, opts.width, opts.height);
		}

		function drawTitle(text) {
			titleElem.textContent = text;
		}

		var graphX = opts.padding + 0.5;
		var graphY = opts.padding*2 + opts.fontSize + 0.5;
		var graphHeight = opts.height - graphY - opts.padding;
		var graphWidth = opts.width - graphX - opts.padding;
		function drawGraph() {
			c.fillStyle = '#131';
			c.fillRect(graphX, graphY, graphWidth, graphHeight);

			drawTrendLine();
			drawExtremeBars();
		}

		function drawTrendLine() {
			c.beginPath();
			for (var i = 0; i < dataPoints.length; i++) {
				var offset = clamp(1 - valAt(i), 0, 1)*graphHeight;
				c.lineTo(i + graphX, offset + graphY);
			}
			c.lineWidth = 1;
			c.strokeStyle = '#0f0';
			c.stroke();
		}

		function drawExtremeBars() {
			for (var i = 0; i < dataPoints.length; i++) {
				if (valAt(i) < 1.0) continue;

				c.beginPath();
				c.strokeStyle = 'red';
				c.moveTo(graphX + i, graphY);
				c.lineTo(graphX + i, graphY + graphHeight);
				c.stroke();
			}
		}

		function valAt(i) {
			var dataPoint = dataPoints[(i + currentDataPoint) % dataPoints.length];
			return dataPoint/opts.maxValue;
		}

		function formatMS(ms) {
			var suffix = 'ms';
			if (ms > 1000) {
				ms /= 1000;
				suffix = 's ';
			}
			var str = ms.toFixed(2);
			while (str.length < 6) str = ' ' + str;
			return str + suffix;
		}

		function clamp(n, a, b) {
			return max(a, min(b, n));
		}
	}
});