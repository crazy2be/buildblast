function Clock(conn) {
	var self = this;

	conn.on('ntp-sync', proccessSync);

	var offset = 0;
	self.time = function () {
		return offset + now();
	}

	var clientTime;
	function startSync() {
		clientTime = now();
		conn.queue('ntp-sync', {});
	}

	function proccessSync(payload) {
		// http://en.wikipedia.org/wiki/Network_Time_Protocol
		var t0, t1, t2, t3;
		t0 = clientTime;
		// Assume t1 === t2 since that makes things
		// easier on the server side.
		t1 = t2 = payload.ServerTime;
		t3 = now();

		var newOffset = ((t1 - t0) + (t2 - t3))/2;
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
