//For now throttling, one day sending stuff back the the server.

define([], function () {
	var _thottledFncs = {};
	function throttleCalls(name, minDuration, fnc) {
		_thottledFncs[name] = _thottledFncs[name] || { count: 0, lastTime: 0, fnc: fnc };

		var info = _thottledFncs[name];

		var curTime = new Date().getTime();

		info.count++;
		if (info.lastTime + minDuration > curTime) return;

		fnc(info.count);

		info.lastTime = curTime;
		info.count = 0;
	}

	function clearOldThrottledBuffer(minDuration) {
		var curTime = new Date().getTime();

		for (var key in _thottledFncs) {
			var info = _thottledFncs[key];

			if (info.lastTime + minDuration > curTime) continue;

			info.fnc(info.count);

			info.lastTime = curTime;
			info.count = 0;
		}
	}

	setInterval(clearOldThrottledBuffer, 500);

	var THROTTLED_MIN_DURATION = 2500;

	function onError(error, count) {
		var message = error;
		if (count > 1) {
			message += " (" + count + ")";
		}
		console.error(message);
	}
	function throttledError(error) {
		throttleCalls(error, THROTTLED_MIN_DURATION, onError.bind(null, error));
	}

	function onWarning(warning, count) {
		var message = warning;
		if (count > 1) {
			message += " (" + count + ")";
		}
		console.warn(message);
	}
	function throttledWarn(warning) {
		throttleCalls(warning, THROTTLED_MIN_DURATION, onWarning.bind(null, warning));
	}

	function onLog(log, count) {
		var message = log;
		if (count > 1) {
			message += " (" + count + ")";
		}
		console.log(message);
	}
	function throttledLog(log) {
		throttleCalls(log, THROTTLED_MIN_DURATION, onLog.bind(null, log));
	}

	return {
		onError: onError,
		onWarning: onWarning,
		onLog: onLog,
	};
});