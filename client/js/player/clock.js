function Clock(conn) {
	var self = this;

	conn.on('ntp-sync', proccessSync);

	var offset = 0;
	self.time = function () {
		return offset + now();
	}

	function startSync() {
		conn.queue('ntp-sync', {
			ClientTime: now(),
		});
	}

	function proccessSync(payload) {
		// http://en.wikipedia.org/wiki/Network_Time_Protocol
		var t0 = payload.ClientTime;
		var t12 = payload.ServerTime;
		var t3 = now();

		var newOffset = t12 - (t0 - t3)/2;
		console.log("Syncronized time with server. We were off by ", offset - newOffset, "ms.");
		offset = newOffset;
	}

	function now() {
		// return window.performance.now();
		return Date.now();
	}

	startSync();
	setInterval(startSync, 5000); // 5 seconds
}
