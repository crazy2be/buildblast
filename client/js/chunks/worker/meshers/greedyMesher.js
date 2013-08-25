var meshCommon = getMeshCommon();

//Returns same as simpleMesh
//From http://0fps.wordpress.com/2012/06/30/meshing-in-a-minecraft-game/
//Fairly simple, first we decompose the chunk into faces, and that loop over faces
//on the same plane (ex, all bottom faces when y=0).
//We then do a 2D greedy meshing on that plane.
//2D greedy meshing is just:
//1)Loop over all squares on the plane.
//2)At each square try to make a large rectangle (quad) from that square
//  (combining that square with surrounding squares of the same type).
//      The algorithm to make the rectangle just extends the height as much as possible,
//      then the width, so its not the largest rectangle at that position
//3)Remove all the squares inside that rectangle from the plane (so you don't consider them again).
function greedyMesher(blocks, voxelization, cc, manager) {
	var ccArr = [cc.x, cc.y, cc.z];

	var chunkDims = [CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH];
	meshCommon.preprocessBlocks(blocks);

	var bcxStart = CHUNK_WIDTH * cc.x;
	var bcyStart = CHUNK_HEIGHT * cc.y;
	var bczStart = CHUNK_DEPTH * cc.z;

	var verts = []; //Each vertice is made of 3 integers (3D point)
	var blockTypes = []; //1 per face, which is has 5 points, so 15 verts
	var faceNumbers = []; //same a blockTypes in size
	var indexes = []; //indexes for triangles of points in verts

	//Go over our blocks in 6 passes, 1 for every face (of a cube).

	//See meshCommon.js for more explanation of LOOP_CUBEFACES_DATA and mnemonics used.

	for (var iFace = 0; iFace < 6; iFace++) {
		var faceDirection = meshCommon.LOOP_CUBEFACES_DATA[iFace].faceDirection;
		var compX = meshCommon.LOOP_CUBEFACES_DATA[iFace].compX; //x and y are face plane
		var compY = meshCommon.LOOP_CUBEFACES_DATA[iFace].compY;
		var compZ = meshCommon.LOOP_CUBEFACES_DATA[iFace].compZ; //z is normal to face

		var pcWidth = chunkDims[compX];
		var pcHeight = chunkDims[compY];
		var pcDepth = chunkDims[compZ];

		//array of block types.
		//We only allocate as much as we will need for our voxelization level. When we
        //access the planes we have to scale the coordinates down to account for this.
		var planeSize = pcWidth * pcHeight / voxelization / voxelization;
		var adjacentPlane = new Float32Array(planeSize);
		var curPlane = new Float32Array(planeSize);
		//Gives the blocks which have been added (ignores removed, so not REALLY delta, but close enough)
		var deltaPlane = new Float32Array(planeSize);

		//Gets an offset in the correct chunk
		var ocArr = [CHUNK_WIDTH / 2, CHUNK_HEIGHT / 2, CHUNK_DEPTH / 2];
		ocArr[compZ] += ocArr[compZ] * 2 * faceDirection;

		var adjacentBlocks = meshCommon.getBlockData(manager, blocks, ccArr, ocArr, compZ);

		var pcZAdj = ocArr[compZ];

		if (adjacentBlocks == null) {
			for (var pcX = 0; pcX < pcWidth; pcX += voxelization) {
				for (var pcY = 0; pcY < pcHeight; pcY += voxelization) {
					var index = (pcX * pcWidth / voxelization + pcY) / voxelization;
					adjacentPlane[index] = Block.DIRT; //Any solid would do here
				}
			}
		} else {
			for (var pcX = 0; pcX < pcWidth; pcX += voxelization) {
				for (var pcY = 0; pcY < pcHeight; pcY += voxelization) {
					//Handles the rotation from the plane coords to block coords
					ocArr = [0, 0, 0];
					ocArr[compX] = pcX;
					ocArr[compY] = pcY;
					ocArr[compZ] = pcZAdj;

					var planeBlock = meshCommon.getNeighbourBlockType(ocArr[0], ocArr[1], ocArr[2], adjacentBlocks, compZ, voxelization);

					adjacentPlane[(pcX * pcWidth / voxelization + pcY) / voxelization] = planeBlock;
				}
			}
		}

		//Start off beyond the bounds, and then go back in the bounds inside the loop
		var pcZCur;
		var pcZBound;

		if (faceDirection == -1) {
			pcZCur = 0;
			pcZBound = pcDepth;
		} else {
			pcZCur = pcDepth - voxelization;
			pcZBound = -voxelization;
		}

		while (pcZCur != pcZBound) {
			createPlane(curPlane, pcWidth, pcHeight, pcZCur);
			function createPlane(plane, pcWidth, pcHeight, pcZValue) {
				var ocArr = [0, 0, 0]; //Used to apply rotation

				for (var pcX = 0; pcX < pcWidth; pcX += voxelization) {
					for (var pcY = 0; pcY < pcHeight; pcY += voxelization) {
						//Essentially handles the rotation from the plane coords to block coords
						ocArr[compX] = pcX;
						ocArr[compY] = pcY;
						ocArr[compZ] = pcZValue;

						var planeBlock;
						planeBlock = meshCommon.getVoxelatedBlockType(ocArr[0], ocArr[1], ocArr[2], voxelization, blocks);

						plane[(pcX * pcWidth / voxelization + pcY) / voxelization] = planeBlock;
					}
				}
			}

			//Find the delta plane
			for (var pcX = 0; pcX < pcWidth; pcX += voxelization) {
				for (var pcY = 0; pcY < pcHeight; pcY += voxelization) {
					//No need make a face if the block adjacent to our face is filled,
					//or if we have no block.
					var index = (pcX * pcWidth / voxelization + pcY) / voxelization;

					if (adjacentPlane[index] != Block.AIR || curPlane[index] == Block.AIR) {
						deltaPlane[index] = Block.AIR;
						continue;
					}

					deltaPlane[index] = curPlane[index];
				}
			}

			//Now apply the actual greedy meshing to the deltaPlane
			GreedyMesh(deltaPlane, pcWidth, pcHeight, voxelization, pcZCur, iFace);
			function GreedyMesh(plane, pcWidth, pcHeight, voxelization, pcZCur, iFace) {
				for (var pcX = 0; pcX < pcWidth; pcX += voxelization) {
					for (var pcY = 0; pcY < pcHeight; pcY += voxelization) {
						//The current end of the rectangle (exclusive)
						var pcXEnd = pcX;
						var pcYEnd = pcY;

						//Do a quick check to make sure we are not just empty
						var baseBlock = plane[(pcXEnd * pcWidth / voxelization + pcYEnd) / voxelization];
						if (baseBlock == Block.AIR) continue;

						pcYEnd += voxelization;

						//Try to extend on the y axis
						while (pcYEnd < pcHeight) {
							var curBlock = plane[(pcXEnd * pcWidth / voxelization + pcYEnd) / voxelization];
							if (curBlock != baseBlock) break;

							pcYEnd += voxelization;
						}

						pcXEnd += voxelization;

						//Try to extend on the x axis
						while (pcXEnd < pcWidth) {
							//For every 1 we extend it, we have to check the entire new column
							for (var pyTest = pcY; pyTest < pcYEnd; pyTest += voxelization) {
								var curBlock = plane[(pcXEnd * pcWidth / voxelization + pyTest) / voxelization];
								if (curBlock != baseBlock) break;
							}

							//Did not match all blocks in the column
							if (pyTest != pcYEnd) break;

							pcXEnd += voxelization;
						}

						//Add quad to vertices, faces, etc
						var rotArr = [0, 0, 0];
						rotArr[compX] = pcX;
						rotArr[compY] = pcY;
						rotArr[compZ] = pcZCur;
						meshCommon.addQuad(rotArr[0] + bcxStart, rotArr[1] + bcyStart, rotArr[2] + bczStart, (pcXEnd - pcX), (pcYEnd - pcY), compZ, faceDirection, voxelization, verts);
						blockTypes.push(baseBlock);
						faceNumbers.push(iFace);

						//Remove all parts of the quad from the plane.
						for (var pcXRem = pcX; pcXRem < pcXEnd; pcXRem += voxelization) {
							for (var pcYRem = pcY; pcYRem < pcYEnd; pcYRem += voxelization) {
								plane[(pcXRem * pcWidth / voxelization + pcYRem) / voxelization] = Block.AIR;
							}
						}

						//We can also increment y by the height, which saves us checks later.
						pcY = pcYEnd - voxelization;
					}
				}
			}

			//The curPlane becomes the adjacentPlane
			var temp = curPlane;
			curPlane = adjacentPlane;
			adjacentPlane = temp;

			//Go opposite the face direction
			pcZCur -= voxelization * faceDirection;
		}
	}

	return meshCommon.generateGeometry(verts, blockTypes, faceNumbers, indexes, voxelization);
}