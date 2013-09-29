//meshCommon

function simpleMesh2(blocks, voxelization, cc, manager) {
	var cw = CHUNK.WIDTH;
	var ch = CHUNK.HEIGHT;
	var cd = CHUNK.DEPTH;

	meshCommon.preprocessBlocks(blocks);

	var ccArr = [cc.x, cc.y, cc.z];

	var bcxStart = CHUNK.WIDTH * cc.x;
	var bcyStart = CHUNK.HEIGHT * cc.y;
	var bczStart = CHUNK.DEPTH * cc.z;

	var verts = []; //Each vertice is made of 3 integers (3D point)
	var blockTypes = []; //1 per face, which is has 5 points, so 15 verts
	var faceNumbers = []; //same a blockTypes in size
	var indexes = []; //indexes for triangles of points in verts

	function addBlockGeometry(ocX, ocY, ocZ, voxelization) {
		var noise = [];
		var ourBlockType = meshCommon.getVoxelatedBlockType(ocX, ocY, ocZ, blocks, voxelization);
		if (ourBlockType == Block.AIR) return;

		var oMax = [CHUNK.WIDTH, CHUNK.HEIGHT, CHUNK.DEPTH];

		for(var iFace = 0; iFace < 6; iFace++) {
			var faceDirection = meshCommon.LOOP_CUBEFACES_DATA[iFace].faceDirection;
			var compX = meshCommon.LOOP_CUBEFACES_DATA[iFace].compX; //x and y are face plane
			var compY = meshCommon.LOOP_CUBEFACES_DATA[iFace].compy; 
			var compZ = meshCommon.LOOP_CUBEFACES_DATA[iFace].compZ; //z is normal to face

			var oAdjArr = [ocX, ocY, ocZ];
			oAdjArr[compZ] += faceDirection * voxelization;

			var adjacentBlocks = meshCommon.getBlockData(manager, blocks, ccArr, oAdjArr, compZ);

			//We assume it's dirt if we cannot access an adjacent chunk
			var adjacentBlock;
			if(!adjacentBlocks) { //Not loaded
				adjacentBlock = Block.DIRT;
			} else if(adjacentBlocks != blocks) { //Neighbour
				adjacentBlock = meshCommon.getNeighbourBlockType(oAdjArr[0], oAdjArr[1], oAdjArr[2],
					adjacentBlocks, compZ, voxelization);
			} else { //In current chunk
				adjacentBlock = meshCommon.getVoxelatedBlockType(oAdjArr[0], oAdjArr[1], oAdjArr[2], blocks, voxelization);
			}

			if(adjacentBlock == Block.AIR) {
				meshCommon.addQuad(ocX + bcxStart, ocY + bcyStart, ocZ + bczStart, voxelization, voxelization, compZ, faceDirection, voxelization, verts);
				blockTypes.push(ourBlockType);
				faceNumbers.push(iFace);
			}
		}
	}

	for (var ocX = 0; ocX < cw; ocX += voxelization) {
		for (var ocY = 0; ocY < ch; ocY += voxelization) {
			for (var ocZ = 0; ocZ < cd; ocZ += voxelization) {
				addBlockGeometry(ocX, ocY, ocZ, voxelization);
			}
		}
	}

	return meshCommon.generateGeometry(verts, blockTypes, faceNumbers, indexes, voxelization);
}