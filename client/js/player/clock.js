function Clock(conn) {
	var self = this;


	var offset = 0;
	self.time = function () {
		return offset + now();
	};

	self.update = function () {

	};

	self.init = function (serverTime) {
		offset = calcOffset(clientTime, serverTime, serverTime, now());
		conn.on('ntp-sync', proccessSync);
		startSync();
	}

	var clientTime = now();
	function startSync() {
		clientTime = now();
		conn.queue('ntp-sync', {});
	}

	// http://en.wikipedia.org/wiki/Network_Time_Protocol
	function calcOffset(t0, t1, t2, t3) {
		var newOffset = ((t1 - t0) + (t2 - t3)) / 2;
		console.log("Syncronized time with server. We were off by ", offset - newOffset, "ms.");
		console.log("Round trip connection based ping is", t3 - t0, "ms");
		return newOffset;
	}

	function proccessSync(payload) {
		var serverTime = payload.ServerTime;
		offset = calcOffset(clientTime, serverTime, serverTime, now());

		// Re-sync in 5 seconds
		setTimeout(startSync, 5000);
	}

	function now() {
		return window.performance.now();
	}
}
