function WorkerChunkManager() {
	var self = this;
	var chunkList = {};

	self.get = function (cc) {
		return chunkList[ccStr(cc)];
	}

	self.set = function (cc, item) {
		chunkList[ccStr(cc)] = item;
	}

	self.top = function () {
		var highest = -1000;
		var key = "";
		for (var k in chunkList) {
			var item = chunkList[k];
			if (item.priority > highest
				&& item.shown && item.changed
			) {
				highest = item.priority;
				key = k;
			}
		}
		return chunkList[key];
	}

	self.each = function (cb) {
		for (var k in chunkList) {
			cb(chunkList[k])
		}
	}

	self.chunkAt = function (ccx, ccy, ccz) {
		return self.get({x: ccx, y: ccy, z: ccz});
	}

	self.refreshNeighbouring = function (cc) {
		var ccx = cc.x;
		var ccy = cc.y;
		var ccz = cc.z;
		function r(ccx, ccy, ccz) {
			var chunk = self.get({x: ccx, y: ccy, z: ccz});
			if (chunk) chunk.changed = true;
		};
		r(ccx + 1, ccy, ccz);
		r(ccx - 1, ccy, ccz);
		r(ccx, ccy + 1, ccz);
		r(ccx, ccy - 1, ccz);
		r(ccx, ccy, ccz + 1);
		r(ccx, ccy, ccz - 1);
	}
}