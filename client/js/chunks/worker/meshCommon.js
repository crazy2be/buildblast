var meshCommon = function() {
	var meshCommon = {};
	//IMPORTANT! Before you call any of these functions, run this function on your blocks array!
	//This makes it so all empty blocks become AIR, I found this makes the
	//greedy mesher about 20% faster (even with the preprocessing).
	meshCommon.preprocessBlocks = function (blocks) {
		for (var index = 0; index < blocks.length; index++) {
			if (Block.isInvisible(blocks[index])) {
				blocks[index] = Block.AIR;
			}
		}
	}

	//The order is important here! It makes sure the normals line up with the 'face numbers' given
	//by Block.getColors.
	meshCommon.LOOP_CUBEFACES_DATA = [
		{faceDirection: 1,  compX: 1, compY: 2, compZ: 0},
		{faceDirection: -1, compX: 1, compY: 2, compZ: 0},
		{faceDirection: 1,  compX: 2, compY: 0, compZ: 1},
		{faceDirection: -1, compX: 2, compY: 0, compZ: 1},
		{faceDirection: 1,  compX: 0, compY: 1, compZ: 2},
		{faceDirection: -1, compX: 0, compY: 1, compZ: 2}
	];

	function noiseFunc(bcX, bcY, bcZ, voxelization) {
		function n(q) {
			return perlinNoise(Math.abs(bcX) / q, Math.abs(bcY) / q, Math.abs(bcZ) / q);
		}
		var val = n(8) + n(32);
		if (abs(voxelization - 4) > 0.001) val += n(4);
		if (abs(voxelization - 2) > 0.001) val += n(2);
		return clamp(val / 2 + 0.5, 0.0, 1.0);
	}

	meshCommon.getVoxelatedBlockType = function(ocXStart, ocYStart, ocZStart, blocks, voxelization) {
		if(voxelization == 1) {
			return blocks[
						ocXStart * CHUNK_WIDTH * CHUNK_HEIGHT +
						ocYStart * CHUNK_WIDTH +
						ocZStart
					];
		}

		//Ugh... have to sample to find the block
		var blockCounts = [];

		//If we wanted to allow for say, voxelization of 3 (meaning the edges
		//are different size) this would be where we would do part of it... it would
		//make the chunk boundaries look bad though.

		var ocXEnd = ocXStart + voxelization;
		var ocYEnd = ocYStart + voxelization;
		var ocZEnd = ocZStart + voxelization;

		for (var ocX = ocXStart; ocX < ocXEnd; ocX++) {
			for (var ocY = ocYStart; ocY < ocYEnd; ocY++) {
				for (var ocZ = ocZStart; ocZ < ocZEnd; ocZ++) {
					var sampleBlockType = blocks[
							ocX * CHUNK_WIDTH * CHUNK_HEIGHT +
							ocY * CHUNK_WIDTH +
							ocZ
						];
					if (!blockCounts[sampleBlockType]) {
						blockCounts[sampleBlockType] = 0;
					}
					blockCounts[sampleBlockType]++;
				}
			}
		}

		//We make our block the most common block, excluding non-solid blocks.
		//However if we are all air, then we do become air (really we just don't
		//render).
		var maxCount = 0;
		var planeBlock = Block.AIR; //Eh... slightly different than simpleMesher, but will result in the same thing.

		for(var blockType = 0; blockType < blockCounts.length; blockType++) {
			var blockCount = blockCounts[blockType];
			if (blockCount > maxCount && blockType != Block.AIR) {
				maxCount = blockCount;
				planeBlock = blockType;
			}
		}

		return planeBlock;
	}

	meshCommon.getNeighbourBlockType = function(ocXStart, ocYStart, ocZStart, blocks, neighbourComp, voxelization) {
		var sampleSizeArr = [voxelization, voxelization, voxelization];
		sampleSizeArr[neighbourComp] = 1;
		for (var ocX = ocXStart; ocX < sampleSizeArr[0] + ocXStart; ocX++) {
			for (var ocY = ocYStart; ocY < sampleSizeArr[1] + ocYStart; ocY++) {
				for (var ocZ = ocZStart; ocZ < sampleSizeArr[2] + ocZStart; ocZ++) {
					var adjBlock = blocks[  
							ocX * CHUNK_WIDTH * CHUNK_HEIGHT +
							ocY * CHUNK_WIDTH +
							ocZ];
					if (adjBlock == Block.AIR) {
						return Block.AIR;
					}
				}
			}
		}
		return Block.DIRT; //Any solid would do
	}

	//ocArr is an in/out, if it is beyond the bounds of the cc chunk, a neighbour chunk's data
	//  is returned and oc is modified to be relative to that.
	//compZ is the dimension in ocArr we should check.
	//Assumes ocArr is only 1 off, which makes it easier for greedyMesher.
	//Returns null if the chunk does not exist
	var chunkDims = [CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH];
	meshCommon.getBlockData = function(manager, blocks, ccArr, ocArr, compZ) {
		var ccDirection = 0;
		if (ocArr[compZ] < 0) {
			ocArr[compZ] = chunkDims[compZ] - 1;
			ccDirection = -1;
		}
		else if (ocArr[compZ] >= chunkDims[compZ]) {
			ocArr[compZ] = 0;
			ccDirection = +1;
		} else {
			return blocks;
		}

		ccArr[compZ] += ccDirection;
		var neighbourChunk = manager.chunkAt(ccArr[0], ccArr[1], ccArr[2]);
		ccArr[compZ] -= ccDirection;

		if(!neighbourChunk) return null;

		return neighbourChunk.blocks;
	}

	var VERTS_PER_FACE = 4;
	meshCommon.addQuad = function(bcX, bcY, bcZ, quadWidth, quadHeight, compZ, faceDirection, voxelization, verts) {
		//The face direction is always right-hand rule, so we place the vertices accordingly
		var counterClockwise = [
				[0, 0],
				[1, 0],
				[1, 1],
				[0, 1]
			];
		var clockwise = [
				[0, 0],
				[0, 1],
				[1, 1],
				[1, 0]
			];
		if(counterClockwise.length != VERTS_PER_FACE || clockwise.length != VERTS_PER_FACE) {
			throw "Update VERTS_PER_FACE...";
		}
		var offsetArray = faceDirection == 1 ? counterClockwise : clockwise;

		var bcVerts = [bcX, bcY, bcZ];

		if (faceDirection == 1) {
			bcVerts[compZ] += voxelization;
		}

		//The amount we make vertices overlap to prevent rounding problems.
		var quadBufferPercent = 0.0005;

		for (var iVertex = 0; iVertex < offsetArray.length; iVertex++) {
			var offsets = offsetArray[iVertex];

			var curWidth;
			var curHeight;

			if(offsets[0]) {
				curWidth = quadWidth * offsets[0] * (1 + quadBufferPercent);
			} else {
				curWidth = quadWidth * -quadBufferPercent;
			}
			if(offsets[1]) {
				curHeight = quadHeight * offsets[1] * (1 + quadBufferPercent);
			} else {
				curHeight = quadHeight * -quadBufferPercent;
			}

			bcVerts[(compZ + 1) % 3] += curWidth;
			bcVerts[(compZ + 2) % 3] += curHeight;

			verts.push(bcVerts[0], bcVerts[1], bcVerts[2]);

			bcVerts[(compZ + 1) % 3] -= curWidth;
			bcVerts[(compZ + 2) % 3] -= curHeight;
		}
	}

	//This is the function which most meshers should call to create their return structure.

	//Takes:
	//var verts = []; //Each vertice is made of 3 integers (3D point)
	//var blockTypes = []; //1 per face, which is has VERTS_PER_FACE points, so 3 * VERTS_PER_FACE verts
	//var faceNumbers = []; //same a blockTypes in size
	//var indexes = []; //indexes for triangles of points in verts
	meshCommon.generateGeometry = function(verts, blockTypes, faceNumbers, indexes, voxelization) {
		function copy(src, dst) {
			for (var i = 0; i < src.length; i++) {
				dst[i] = src[i];
			}
		}

		var vertsa = new Float32Array(verts.length);
		copy(verts, vertsa);

		//Bunch of squares, point in each corner and one in the middle
		//Each point is made up of 3 numbers
		for(var iVert = 0; iVert < verts.length / 3; iVert += VERTS_PER_FACE) {
			//2 triangle faces
			indexes.push(iVert, iVert + 1, iVert + 2);
			indexes.push(iVert + 2, iVert + 3, iVert);
			//Code for 4 triangle faces:
			//indexes.push(iVert, iVert + 1, iVert + 4);
			//indexes.push(iVert + 1, iVert + 2, iVert + 4);
			//indexes.push(iVert + 2, iVert + 3, iVert + 4);
			//indexes.push(iVert + 3, iVert, iVert + 4);
		}

		var color = [];

		for(var iFace = 0; iFace < verts.length / (3 * VERTS_PER_FACE); iFace++) {
			var iVertexStart = iFace * 3 * VERTS_PER_FACE;
			var blockType = blockTypes[iFace];
			var faceNumber = faceNumbers[iFace];

			var colours = Block.getColours(blockType, faceNumber);
			var c = colours.light;
			var c2 = colours.dark;

			for(var iVertex = 0; iVertex < VERTS_PER_FACE; iVertex++) {
				var iVS = iVertexStart + iVertex * 3;
				var noise = noiseFunc(verts[iVS], verts[iVS + 1], verts[iVS + 2], voxelization);

				var r = c.r*noise + c2.r*(1 - noise);
				var g = c.g*noise + c2.g*(1 - noise);
				var b = c.b*noise + c2.b*(1 - noise);
				color.push(r/255, g/255, b/255);
			}
		}

		var indexa = new Uint16Array(indexes.length);
		copy(indexes, indexa);

		var colora = new Float32Array(color.length);
		copy(color, colora);

		var attributes = {
			position: { //x, y, z (triangles)
				itemSize: 3,
				array: vertsa,
				numItems: verts.length,
			},
			index: {    //triangle indices inside position (so *3 for real index), every 3 make up a triangle.
				itemSize: 1,
				array: indexa,
				numItems: indexes.length,
			},
			color: {    //colors of positions (vertices), we use a vertex shader
						//(possibly a built in one) to color the faces based on these.
				itemSize: 3,
				array: colora,
				numItems: color.length,
			},
		};
		var offsets = [{ //Just states the indexes used, you could theoretically have multiple of these?
			start: 0,
			count: indexes.length,
			index: 0,
		}];

		return {
			attributes: attributes,
			offsets: offsets,
			transferables: [vertsa.buffer, indexa.buffer, colora.buffer],
		};
	}

	return meshCommon;
}();