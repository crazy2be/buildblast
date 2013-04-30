var PerfChart = CanvasPerfChart;

function CanvasPerfChart(opts) {
    var defaultOpts = {
        title: '',
        maxValue: 200,
    };
    opts = opts || {};
    for (var opt in defaultOpts) {
        if (opt in opts) continue;
        else opts[opt] = defaultOpts[opt];
    }

    var width = 80;
    var height = 48;

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.cssText = [
        'width: '+width+'px',
        'height: '+height+'px',
        'opacity: 0.9',
    ].join(';');
    var c = canvas.getContext('2d');

    var dataPoints = [];
    for (var i = 0; i < 74; i++) {
        dataPoints[i] = 0;
    }
    var currentDataPoint = 0;

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

    function addDataPoint(ms) {
        if (ms > opts.maxValue) {
            drawBackground('red');
        } else {
            drawBackground('#020');
        }
        drawTitle(formatMS(ms) + opts.title);

        dataPoints[currentDataPoint] = ms;
        drawGraph();

        currentDataPoint++;
        if (currentDataPoint >= dataPoints.length) {
            currentDataPoint = 0;
        }
    }

    function drawBackground(color) {
        c.fillStyle = color;
        c.fillRect(0, 0, width, height);
    }

    function drawTitle(text) {
        c.fillStyle = '#0f0';
        c.textBaseline = 'top';
        c.fillText(text, 0, 0);
    }

    function drawGraph() {
        c.beginPath();
        c.moveTo(0, 10);
        for (var i = 0; i < dataPoints.length; i++) {
            var dataPoint = dataPoints[(i + currentDataPoint) % dataPoints.length];
            var val = dataPoint/opts.maxValue;
            var offset = clamp(1 - val, 0, 1)*30 + 10;
            c.lineTo(i, offset);
        }
        c.lineWidth = 1;
        c.strokeStyle = '#0f0';
        c.stroke();
    }

    return {
        elm: canvas,
        addDataPoint: addDataPoint,
    };
}

function DOMPerfChart(opts) {
	var defaultOpts = {
		title: '',
		maxValue: 200,
	}
	opts = opts || {};
	for (var opt in defaultOpts) {
		if (!(opt in opts)) {
			opts[opt] = defaultOpts[opt];
		}
	}

	var wrapper = document.createElement('div');
	wrapper.style.cssText = [
		'width: 80px',
		'opacity: 0.9'].join(';');

	var container = document.createElement('div');
	container.style.cssText = [
		'padding: 0 0 3px 3px',
		'text-align: left',
		'background-color: #020'].join(';');
	wrapper.appendChild(container);

	var title = document.createElement('div');
	title.style.cssText = [
		'color: #0f0',
		'font-size: 9px',
		'line-height: 15px',
		'white-space: pre'].join(';');
	container.appendChild(title);

	var graph = document.createElement('div');
	graph.style.cssText = [
		'position: relative',
		'width: 74px',
		'height: 30px',
		'background-color: #0f0'].join(';');
	container.appendChild(graph);

	while (graph.children.length < 74) {
		var bar = document.createElement('span');
		bar.style.cssText = [
			'width: 1px;',
			'height: 30px',
			'float: left',
			'background-color: #131'].join(';');
		graph.appendChild(bar);
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

	function addDataPoint(ms) {
		title.innerText = formatMS(ms) + opts.title;
		if (ms > opts.maxValue) {
			container.style.backgroundColor = 'red';
		} else {
			container.style.backgroundColor = '#020';
		}

		var val = clamp(1 - ms/opts.maxValue, 1/30, 1)*30;

		var child = graph.appendChild(graph.firstChild);
		child.style.height = val + 'px';

		if (ms > opts.maxValue) {
			child.style.backgroundColor = 'red';
		} else {
			child.style.backgroundColor = '#131';
		}
	}

	return {
		elm: wrapper,
		addDataPoint: addDataPoint,
	}
};
