define(function(require) {

var Protocol = require("core/protocol");

return function Clock(conn) {
	var self = this;

	var defaultLagInduction = 100;

	var curTime = 0;
	// Only updated after you call .update(). This way, all
	// things querying the time in a frame will get the
	// same time.
	self.time = function () {
		return curTime;
	};

	var lastUpdateDT = 0.0;
	// Time differential between this frame and the last
	// drawn frame.
	self.dt = function () {
		return lastUpdateDT
	}

	//The time which we use to display entities (lag induction)
	self.entityTime = function () {
		var lagInduction = localStorage.lagInductionTime || defaultLagInduction;
		return self.time() - lagInduction;
	};

	// Actual client <-> server offset, according to most
	// recent sync.
	var offset = 0;
	// How much of the offset we've actually applied. We
	// don't want to apply it all at once, because that will
	// cause lots of jerk.
	var appliedOffset = 0;
	var prevNow = now();
	self.update = function () {
		var curNow = now();
		var dt = curNow - prevNow;
		var doff = offset - appliedOffset;
		appliedOffset += min(abs(dt * 0.1), abs(doff)) * signum(doff);

		var prevTime = curTime;
		curTime = appliedOffset + curNow;
		prevNow = curNow;
		lastUpdateDT = curTime - prevTime;
	};

	function signum(n) {
		if (n > 0) return 1;
		else if (n < 0) return -1;
		else return 0;
	}

	self.init = function (serverTime) {
		offset = calcOffset(clientTime, serverTime, serverTime, now());
		// We want to apply the initial offset right away
		appliedOffset = offset;
		conn.on(Protocol.MSG_NTP_SYNC_REPLY, function(msg) {
			var serverTime = msg.serverTime;
			offset = calcOffset(clientTime, serverTime, serverTime, now());

			// Re-sync in 5 seconds
			setTimeout(startSync, 5000);
		});
		startSync();
	};

	var clientTime = now();
	function startSync() {
		clientTime = now();
		conn.queue(Protocol.MSG_NTP_SYNC_REQUEST, []);
	}

	// http://en.wikipedia.org/wiki/Network_Time_Protocol
	function calcOffset(t0, t1, t2, t3) {
		var newOffset = ((t1 - t0) + (t2 - t3)) / 2;
		console.log("Syncronized time with server. We were off by ", offset - newOffset, "ms.");
		console.log("Round trip connection based ping is", t3 - t0, "ms");
		return newOffset;
	}

	function now() {
		return window.performance.now();
	}
}
});
