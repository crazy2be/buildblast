var LagStats = function () {
	var container = document.createElement('div');
	container.id = 'lag-stats';
	container.style.cssText = 'width:80px;opacity:0.9';

	var msDiv = document.createElement('div');
	msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020';
	container.appendChild(msDiv);

	var msText = document.createElement('div');
	msText.style.cssText = 'color:#0f0;font-size:9px;line-height:15px;white-space:pre;';
	msText.innerHTML = 'MS lag';
	msDiv.appendChild(msText);

	var msGraph = document.createElement('div');
	msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
	msDiv.appendChild(msGraph);

	while (msGraph.children.length < 74) {
		var bar = document.createElement('span');
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
		msGraph.appendChild(bar);
	}

	var updateGraph = function (elm, value) {
		var child = elm.appendChild(elm.firstChild);
		child.style.height = value + 'px';
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

	return {
		domElement: container,
		addDataPoint: function (ms) {
			msText.innerText = formatMS(ms) + ' lag';
			updateGraph(msGraph, Math.min(1, 1 - ms/200)*30);
		},
	}
};
