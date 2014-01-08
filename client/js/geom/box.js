define(function (require) {
var THREE = require("THREE");

return function Box(halfExtents, centerOffset) {
	var self = this;
	var p = new THREE.Vector3(0, 0, 0);
	centerOffset = centerOffset || new THREE.Vector3(0.0, 0.0, 0.0);

	self.setPosition = function (newPos) {
		p = newPos;
		return self;
	};

	// We might want to move this at some point...
	// You can't have boxes checking collisions with
	// other boxes, or your collision detection will
	// become O(n^2). Boxes checking world is fine,
	// that's only O(n), but it might make sence to
	// move this once we have a more comprehensive
	// collision interface.
	self.collides = function (world) {
		return volumeBlockCollides(blockCollide.bind(null, world));
	}

	// We can do this (fairly) efficiently because
	// of the assumed resolution of the voxel world.
	function volumeBlockCollides(blockCollide) {
		var he = halfExtents;
		var co = centerOffset;
		var f = Math.floor;
		var xs = f(p.x + co.x - he.x), xe = f(p.x + co.x + he.x);
		var ys = f(p.y + co.y - he.y), ye = f(p.y + co.y + he.y);
		var zs = f(p.z + co.z - he.z), ze = f(p.z + co.z + he.z);

		for (var x = xs; x <= xe; x++) {
			for (var y = ys; y <= ye; y++) {
				for (var z = zs; z <= ze; z++) {
					if (blockCollide(x, y, z)) {
						return new THREE.Vector3(x, y, z);
					}
				}
			}
		}

		return null;
	}

	function blockCollide(world, x, y, z) {
		return world.blockAt(x, y, z).solid();
	}

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
}
});
