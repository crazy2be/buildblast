define(function (require) {
var common = require("../chunkCommon");

return function WorkerChunkManager() {
	var self = this;
	var chunkList = {};

	self.get = function (cc) {
		return chunkList[common.ccStr(cc)];
	}

	self.set = function (cc, item) {
		chunkList[common.ccStr(cc)] = item;
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

	self.chunkAt = function (ccX, ccY, ccZ) {
		return self.get({ x: ccX, y: ccY, z: ccZ });
	}

	self.refreshNeighbouring = function (cc) {
		var ccX = cc.x;
		var ccY = cc.y;
		var ccZ = cc.z;
		function r(ccX, ccY, ccZ) {
			var chunk = self.get({ x: ccX, y: ccY, z: ccZ });
			if (chunk) chunk.changed = true;
		};
		r(ccX + 1, ccY, ccZ);
		r(ccX - 1, ccY, ccZ);
		r(ccX, ccY + 1, ccZ);
		r(ccX, ccY - 1, ccZ);
		r(ccX, ccY, ccZ + 1);
		r(ccX, ccY, ccZ - 1);
	}
}
});
