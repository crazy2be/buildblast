//Head I know, they shouldn't be global... I will make
//it fit the require format, later...

//boundingBox = [xs, ys, zs, xe, ye, ze]

//Returns the coords (THREE.Vector3) of a collision,
//if it exists, null otherwise. blockCollide is a function which takes
//a block (or whatever world.blockAt gives us) and
//returns true if it counts as a collision.

function boundingBoxHasACollision(world, boundingBox, blockCollide) {
	var bb = boundingBox;
	//Turn everything into integers
	for(var iDim = 0; iDim < 3; iDim++) {
		bb[iDim] = Math.floor(bb[iDim]);
	}
	for(var iDim = 3; iDim < 6; iDim++) {
		bb[iDim] = Math.ceil(bb[iDim]);
	}
	var curPos = [0, 0, 0];
	//x, y, z, iterating in this way is the same way the blocks
	//are stored linearly in memory, so it's good.
	curPos[0] = bb[0];
	while(curPos[0] <= bb[3]) {
		curPos[1] = bb[1];
		while(curPos[1] <= bb[4]) {
			curPos[2] = bb[2];
			while(curPos[2] <= bb[5]) {
				var block = world.blockAt(curPos[0], curPos[1], curPos[2]);
				if(blockCollide(block)) {
					return new THREE.Vector3(curPos[0], curPos[1], curPos[2]);
				}
				curPos[2]++;
			}
			curPos[1]++;
		}
		curPos[0]++;
	}

	return null;
}

function pointCollides(point, boundingBox) {
	return boundingBox[0] <= point.x && point.x <= boundingBox[3] &&
		boundingBox[1] <= point.y && point.y <= boundingBox[4] &&
		boundingBox[2] <= point.z && point.z <= boundingBox[5];
}