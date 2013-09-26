//Fulfills volume requirements, which is to expose
//a boundingBox, collides and blockCollide function.
function Box(halfExtents, centerOffset) {
	var self = this;
	centerOffset = centerOffset || new THREE.Vector3(0.0, 0.0, 0.0);

	//Returns [xs, ys, zs, xe, ye, ze]
	function boundingBox(pos) {
		var p = pos;
		var he = halfExtents;
		var co = centerOffset;
		var xs = p.x + co.x - he.x, xe = p.x + co.x + he.x;
		var ys = p.y + co.y - he.y, ye = p.y + co.y + he.y;
		var zs = p.z + co.z - he.z, ze = p.z + co.z + he.z;

		return [xs, ys, zs, xe, ye, ze];
	}

	//QTODO: Remove this from box.js
	//Returns true if the box at that position
	//collides, false otherwise.
	self.collides = function(world, pos) {
		return boundingBoxHasACollision(
			world,
			pos,
			blockCollide
		);
	}

	function boundingBoxHasACollision (world, pos, blockCollide) {
		var bb = boundingBox(pos);
		//Turn everything into integers
		for(var iDim = 0; iDim < 3; iDim++) {
			bb[iDim] = Math.floor(bb[iDim]);
		}
		for(var iDim = 3; iDim < 6; iDim++) {
			bb[iDim] = Math.floor(bb[iDim]);
		}
		var x, y, z;
		//x, y, z, iterating in this way is the same way the blocks
		//are stored linearly in memory, so it's good.
		x = bb[0];
		while(x <= bb[3]) {
			y = bb[1];
			while(y <= bb[4]) {
				z = bb[2];
				while(z <= bb[5]) {
					var block = world.blockAt(x, y, z);
					if(blockCollide(block)) {
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
	function blockCollide (block) {
		return !block || block.solid();
	}

	self.contains = function(x, y, z) {
		var pos = new THREE.Vector3(x, y, z)
		pointCollides(pos, boundingBox(pos));
	}
}