//Fulfills volume requirements, which is to expose
//a boundingBox, collides and blockCollide function.

define(function (require) {
	var THREE = require("THREE");

	return function Box(halfExtents, centerOffset) {
		var self = this;
		centerOffset = centerOffset || new THREE.Vector3(0.0, 0.0, 0.0);

		//Returns {xs, ys, zs, xe, ye, ze}
		function boundingBox(pos) {
			var p = pos;
			var he = halfExtents;
			var co = centerOffset;
			var xs = p.x + co.x - he.x, xe = p.x + co.x + he.x;
			var ys = p.y + co.y - he.y, ye = p.y + co.y + he.y;
			var zs = p.z + co.z - he.z, ze = p.z + co.z + he.z;

			return { xs: xs, ys: ys, zs: zs, xe: xe, ye: ye, ze: ze };
		}

		//QTODO: Remove this from box.js
		//Returns true if the box at that position
		//collides, false otherwise.
		self.collides = function (world, pos) {
			return boundingBoxHasACollision(
				world,
				pos,
				blockCollide
			);
		}

		function boundingBoxHasACollision(world, pos, blockCollide) {
			var bb = boundingBox(pos);
			//Turn everything into integers
			bb.xs = Math.floor(bb.xs);
			bb.ys = Math.floor(bb.ys);
			bb.zs = Math.floor(bb.zs);
			bb.xe = Math.floor(bb.xe);
			bb.ye = Math.floor(bb.ye);
			bb.ze = Math.floor(bb.ze);

			var x, y, z;
			//x, y, z, iterating in this way is the same way the blocks
			//are stored linearly in memory, so it's good.
			x = bb.xs;
			while (x <= bb.xe) {
				y = bb.ys;
				while (y <= bb.ye) {
					z = bb.zs;
					while (z <= bb.ze) {
						var block = world.blockAt(x, y, z);
						if (blockCollide(block)) {
							return new THREE.Vector3(x, y, z);
						}
						z++;
					}
					y++;
				}
				x++;
			}

			return null;
		}

		function pointCollides(point, boundingBox) {
			return boundingBox[0] <= point.x && point.x <= boundingBox[3] &&
			boundingBox[1] <= point.y && point.y <= boundingBox[4] &&
			boundingBox[2] <= point.z && point.z <= boundingBox[5];
		}

		//QTODO: Remove this from box.js
		function blockCollide(block) {
			return !block || block.solid();
		}

		self.contains = function (x, y, z) {
			var pos = new THREE.Vector3(x, y, z)
			pointCollides(pos, boundingBox(pos));
		}
	}
});