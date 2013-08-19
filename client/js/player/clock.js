function Clock(conn) {
	var self = this;

	var curTime = 0;
	self.time = function () {
		return curTime;
	};

	var offset = 0;
	var appliedOffset = 0;
	var prevNow = now();
	var prevTime = 0;
	self.update = function () {
		var curNow = now();
		var dt = curNow - prevNow;
		var doff = offset - appliedOffset;
		appliedOffset += min(abs(dt*0.5), abs(doff)) * signum(doff);

		curTime = appliedOffset + curNow;
		if (curTime < prevTime) {
			debugger;
		}
		prevNow = curNow;
		prevTime = curTime;
	};

	function signum(n) {
		if (n > 0) return 1;
		else if (n < 0) return -1;
		else return 0;
	}

	self.init = function (serverTime) {
		offset = calcOffset(clientTime, serverTime, serverTime, now());
		appliedOffset = offset;
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
