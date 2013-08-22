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

	self.chunkAt = function (cx, cy, cz) {
		return self.get({x: cx, y: cy, z: cz});
	}

	self.refreshNeighbouring = function (cc) {
		var cx = cc.x;
		var cy = cc.y;
		var cz = cc.z;
		function r(cx, cy, cz) {
			var chunk = self.get({x: cx, y: cy, z: cz});
			if (chunk) chunk.changed = true;
		};
		r(cx + 1, cy, cz);
		r(cx - 1, cy, cz);
		r(cx, cy + 1, cz);
		r(cx, cy - 1, cz);
		r(cx, cy, cz + 1);
		r(cx, cy, cz - 1);
	}
}
