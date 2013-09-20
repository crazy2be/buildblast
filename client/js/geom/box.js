//Fulfills volume requirements, which is to expose
//a boundingBox, collides and blockCollide function.
function Box(halfExtents, centerOffset) {
	var self = this;
	centerOffset = centerOffset || new THREE.Vector3(0.0, 0.0, 0.0);

	//Returns [xs, ys, zs, xe, ye, ze]
	self.boundingBox = function(pos) {
		var p = pos;
		var he = halfExtents;
		var co = centerOffset;
		var xs = p.x + co.x - he.x, xe = p.x + co.x + he.x;
		var ys = p.y + co.y - he.y, ye = p.y + co.y + he.y;
		var zs = p.z + co.z - he.z, ze = p.z + co.z + he.z;

		return [xs, ys, zs, xe, ye, ze];
	}

	//Returns true if the box at that position
	//collides, false otherwise.
	self.collides = function(world, pos) {
		return boundingBoxHasACollision(
			world,
			self.boundingBox(pos),
			self.blockCollide
		);
	}

	self.blockCollide = function(block) {
		return !block || block.solid();
	}
}