//IMPORTANT! Before you call any of these functions, run this function on your blocks array!
//This makes it so all empty blocks become AIR, I found this makes the
//greedy mesher about 20% faster (even with the preprocessing).
function preprocessBlocks(blocks) {
	for (var index = 0; index < blocks.length; index++) {
		if (Block.isInvisible(blocks[index])) {
			blocks[index] = Block.AIR;
		}
	}
}

//The order is important here! It makes sure the normals line up with the 'face numbers' given
//by Block.getColors.
var LOOP_CUBEFACES_DATA = [
//Face direction, (parallel axis), perpendicular axis
	{faceDirection: 1,  compX: 1, compY: 2, compZ: 0},
    {faceDirection: -1, compX: 1, compY: 2, compZ: 0},
    {faceDirection: 1,  compX: 2, compY: 0, compZ: 1},
    {faceDirection: -1, compX: 2, compY: 0, compZ: 1},
    {faceDirection: 1,  compX: 0, compY: 1, compZ: 2},
    {faceDirection: -1, compX: 0, compY: 1, compZ: 2}
];

function noiseFunc(bcX, bcY, bcZ, inverseQuality) {
	function n(q) {
		return perlinNoise(Math.abs(bcX) / q, Math.abs(bcY) / q, Math.abs(bcZ) / q);
	}
	var val = n(8) + n(32);
	if (abs(inverseQuality - 4) > 0.001) val += n(4);
	if (abs(inverseQuality - 2) > 0.001) val += n(2);
	return clamp(val / 2 + 0.5, 0.0, 1.0);
}

function getVoxelatedBlockType(ocXStart, ocYStart, ocZStart, inverseQuality, blocks) {
    if(inverseQuality == 1) {
        return blocks[
				    ocXStart * CHUNK_WIDTH * CHUNK_HEIGHT +
				    ocYStart * CHUNK_WIDTH +
				    ocZStart
			    ];
    }

	//Ugh... have to sample to find the block
	var blockCounts = [];

	//If we wanted to allow for say, inverseQuality of 3 (meaning the edges
	//are different size) this would be where we would do part of it... it would
	//make the chunk boundaries look bad though.

	var ocXEnd = ocXStart + inverseQuality;
	var ocYEnd = ocYStart + inverseQuality;
	var ocZEnd = ocZStart + inverseQuality;

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

function getNeighbourBlockType(ocXStart, ocYStart, ocZStart, blocks, neighbourComp, inverseQuality) {
	var sampleSizeArr = [inverseQuality, inverseQuality, inverseQuality];
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
function getBlockData(manager, blocks, ccArr, ocArr, compZ) {
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

function addQuad(bcX, bcY, bcZ, quadWidth, quadHeight, compZ, faceDirection, inverseQuality, verts) {
	//The face direction is always right-hand rule, so we place the vertices accordingly
	var counterClockwise = [
			[0, 0],
			[1, 0],
			[1, 1],
			[0, 1],
			[0.5, 0.5]
		];
	var clockwise = [
			[0, 0],
			[0, 1],
			[1, 1],
			[1, 0],
			[0.5, 0.5]
		];
	var offsetArray = faceDirection == 1 ? counterClockwise : clockwise;

	var bcVerts = [bcX, bcY, bcZ];

	if (faceDirection == 1) {
		bcVerts[compZ] += inverseQuality;
	}

	for (var iVertex = 0; iVertex < offsetArray.length; iVertex++) {
		var offsets = offsetArray[iVertex];

		bcVerts[(compZ + 1) % 3] += quadWidth * offsets[0];
		bcVerts[(compZ + 2) % 3] += quadHeight * offsets[1];

		verts.push(bcVerts[0], bcVerts[1], bcVerts[2]);

		bcVerts[(compZ + 1) % 3] -= quadWidth * offsets[0];
		bcVerts[(compZ + 2) % 3] -= quadHeight * offsets[1];
	}
}

//This is the function which most meshers should call to create their return structure.

//Takes:
//var verts = []; //Each vertice is made of 3 integers (3D point)
//var blockTypes = []; //1 per face, which is has 5 points, so 15 verts
//var faceNumbers = []; //same a blockTypes in size
//var indexes = []; //indexes for triangles of points in verts
function generateGeometry(verts, blockTypes, faceNumbers, indexes, inverseQuality) {
	function copy(src, dst) {
		for (var i = 0; i < src.length; i++) {
			dst[i] = src[i];
		}
	}

	var vertsa = new Float32Array(verts.length);
	copy(verts, vertsa);

	//Bunch of squares, point in each corner and one in the middle
	//Each point is made up of 3 numbers
	for(var iVert = 0; iVert < verts.length / 3; iVert += 5) {
		indexes.push(iVert, iVert + 1, iVert + 4);
		indexes.push(iVert + 1, iVert + 2, iVert + 4);
		indexes.push(iVert + 2, iVert + 3, iVert + 4);
		indexes.push(iVert + 3, iVert, iVert + 4);
	}

	var color = [];

	for(var iFace = 0; iFace < verts.length / 15; iFace++) {
		var iVertexStart = iFace * 15;
		var blockType = blockTypes[iFace];
		var faceNumber = faceNumbers[iFace];

		var colours = Block.getColours(blockType, faceNumber);
		var c = colours.light;
		var c2 = colours.dark;

		for(var iVertex = 0; iVertex < 5; iVertex++) {
			var iVS = iVertexStart;
			var noise = noiseFunc(verts[iVS], verts[iVS + 1], verts[iVS + 2], inverseQuality);

			var r = c.r*noise + c2.r*(1 - noise);
			var g = c.g*noise + c2.g*(1 - noise);
			var b = c.b*noise + c2.b*(1 - noise);
			color.push(r/255, g/255, b/255);

			iVertexStart += 3;
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