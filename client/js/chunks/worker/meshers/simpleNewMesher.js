var meshCommon = getMeshCommon();

function simpleMesh2(blocks, voxelization, cc, manager) {
	var cw = CHUNK_WIDTH;
	var ch = CHUNK_HEIGHT;
	var cd = CHUNK_DEPTH;

	meshCommon.preprocessBlocks(blocks);

	var ccArr = [cc.x, cc.y, cc.z];

	var bcxStart = CHUNK_WIDTH * cc.x;
	var bcyStart = CHUNK_HEIGHT * cc.y;
	var bczStart = CHUNK_DEPTH * cc.z;

	var verts = []; //Each vertice is made of 3 integers (3D point)
	var blockTypes = []; //1 per face, which is has 5 points, so 15 verts
	var faceNumbers = []; //same a blockTypes in size
	var indexes = []; //indexes for triangles of points in verts

	function addBlockGeometry(ocX, ocY, ocZ, voxelization) {
		var noise = [];
		var ourBlockType = meshCommon.getVoxelatedBlockType(ocX, ocY, ocZ, voxelization, blocks);
		if (ourBlockType == Block.AIR) return;

		var oMax = [CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH];

		for(var iFace = 0; iFace < 6; iFace++) {
			var faceDirection = meshCommon.LOOP_CUBEFACES_DATA[iFace].faceDirection;
			var compX = meshCommon.LOOP_CUBEFACES_DATA[iFace].compX; //x and y are face plane
			var compY = meshCommon.LOOP_CUBEFACES_DATA[iFace].compy; 
			var compZ = meshCommon.LOOP_CUBEFACES_DATA[iFace].compZ; //z is normal to face

			var oAdjArr = [ocX, ocY, ocZ];
			oAdjArr[compZ] += faceDirection * voxelization;

			var adjacentBlocks = meshCommon.getBlockData(manager, blocks, ccArr, oAdjArr, compZ);

			//We assume it's dirt if we cannot access an adjacent chunk
			var adjacentBlock = Block.DIRT;
			if (adjacentBlocks != blocks) {
				if (adjacentBlocks) {
					adjacentBlock = meshCommon.getNeighbourBlockType(oAdjArr[0], oAdjArr[1], oAdjArr[2],
										adjacentBlocks, compZ, voxelization);
				}
			} else {
				adjacentBlock = meshCommon.getVoxelatedBlockType(oAdjArr[0], oAdjArr[1], oAdjArr[2], voxelization, blocks);
			}
			if(adjacentBlock == Block.AIR) {
				meshCommon.addQuad(ocX + bcxStart, ocY + bcyStart, ocZ + bczStart, voxelization, voxelization, compZ, faceDirection, voxelization, verts);
				blockTypes.push(ourBlockType);
				faceNumbers.push(iFace);
			}
		}
	}

	//Pick blocks in increments based on the voxelization (like sampling), later code will look through the
	//area and decide what type the block should really be.
	for (var ocX = 0; ocX < cw; ocX += voxelization) {
		for (var ocY = 0; ocY < ch; ocY += voxelization) {
			for (var ocZ = 0; ocZ < cd; ocZ += voxelization) {
				addBlockGeometry(ocX, ocY, ocZ, voxelization);
			}
		}
	}

	return meshCommon.generateGeometry(verts, blockTypes, faceNumbers, indexes, voxelization);
}