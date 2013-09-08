// Implements simple collision detection between the world
// and a box whose center is at p and has a size described
// by the given halfExtents. Does not do partial application
// of movements. Feel free to improve it!
function Box(p, halfExtents, centerOffset) {
	var self = this;
	centerOffset = centerOffset || new THREE.Vector3(0.0, 0.0, 0.0);

	self.setPos = function (newPos) {
		p = newPos;
	};

	self.attemptMove = function (world, move) {
		if (inSolid(world)) {
			var gh = groundHeight(world);
			move.y = p.y - gh;
			p.y = gh;
		}

		p.x += move.x;
		if (inSolid(world)) {
			p.x -= move.x;
			move.x = 0;
		}

		p.y += move.y;
		if (inSolid(world)) {
			p.y -= move.y;
			move.y = 0;
		}

		p.z += move.z;
		if (inSolid(world)) {
			p.z -= move.z;
			move.z = 0;
		}

		return p;
	};

	self.contains = function (x, y, z) {
		var he = halfExtents;
		var co = centerOffset;
		var xs = p.x + co.x - he.x, xe = p.x + co.x + he.x;
		var ys = p.y + co.y - he.y, ye = p.y + co.y + he.y;
		var zs = p.z + co.z - he.z, ze = p.z + co.z + he.z;

		return xs < x && xe > x &&
			ys < y && ye > y &&
			zs < z && ze > z;
	};

	function bboxEach(fn, reduce) {
		var he = halfExtents;
		var co = centerOffset;
		var xs = p.x + co.x - he.x, xe = p.x + co.x + he.x;
		var ys = p.y + co.y - he.y, ye = p.y + co.y + he.y;
		var zs = p.z + co.z - he.z, ze = p.z + co.z + he.z;
		// TODO: Figure out where more points are needed
		// based on the size of the shape (we use this many
		// because this is needed given the current size of
		// our player model).
		var ym = ys + (ye - ys) / 2;
		return reduce(
			fn(xs, ys, zs),
			fn(xs, ys, ze),
			fn(xs, ye, zs),
			fn(xs, ye, ze),
			fn(xs, ym, zs),
			fn(xs, ym, ze),
			fn(xe, ys, zs),
			fn(xe, ys, ze),
			fn(xe, ye, zs),
			fn(xe, ye, ze),
			fn(xe, ym, zs),
			fn(xs, ym, ze)
		);
	}

	function logicalOr() {
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i]) return true;
		}
		return false;
	}

	function inSolid(world) {
		function solidHere(x, y, z) {
			var block = world.blockAt(x, y, z);
			if (!block) return true;
			else return block.solid();
		}
		return bboxEach(solidHere, logicalOr);
	}

	function groundHeight(world) {
		var cg = world.findClosestGround;
		return bboxEach(cg, Math.max) + halfExtents.y - centerOffset.y;
	}
}