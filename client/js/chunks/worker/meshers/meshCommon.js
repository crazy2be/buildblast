//All meshers return:
//{
//    attributes: {
//            position: { //x, y, z (triangles)
//                itemSize: 3,
//                array: vertsa,
//                numItems: verts.length,
//            },
//            color: { //colors of positions (vertices), we use a vertex shader
//                     //(possibly a built in one) to color the faces based on these.
//                itemSize: 3,
//                array: colora,
//                numItems: color.length,
//            },
//            index: { //triangle indices inside position (so *3 for real index), every 3 make up a triangle.
//                itemSize: 1,
//                array: indexa,
//                numItems: index.length,
//            },
//        },
//    offsets: [{ //Just states the index size, you could theoretically have multiple of these?
//            start: 0,
//            count: index.length,
//            index: 0,
//        }],
//    transferables: [vertsa.buffer, indexa.buffer, colora.buffer],
//};

//IMPORTANT! Before you call any of these functions, run this function on your blocks array!
//This makes it so all empty blocks become AIR, I found this makes the
//greedy mesher about 20% faster (even with the preprocessing).
function preprocessBlocks(blocks, chunkDims) {
    var totalCount = chunkDims[0] * chunkDims[1] * chunkDims[2];
    for (var index = 0; index < totalCount; index++) {
        if (Block.isEmpty(blocks[index])) {
            blocks[index] = Block.AIR;
        }
    }
}

//cc stands for chunk,
//oc stands for offset, as in the block offset within a chunk
//bc stands for block, as in the block position (globally unique)
//pc stands for plane, this means a coordinate in the rotated model we use which abstracts our face creation code.
//  In this model z is perpendicular to the face. compX, compY, etc refer to the mapping from pc to bc (compX = 1, means pcX represents bcY)

//The order is important here! It makes sure the normals line up with the 'face numbers' given
//by Block.getColors.

var LOOP_CUBEFACES_DATA = [
//Face direction, (parallel axis), perpendicular axis
    [1, 1, 2, 0],
    [-1, 1, 2, 0],
    [1, 2, 0, 1],
    [-1, 2, 0, 1],
    [1, 0, 1, 2],
    [-1, 0, 1, 2],
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
    //Ugh... have to sample to find the block
    var blockCounts = {};

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

    for (var blockType in blockCounts) {
        var blockCount = blockCounts[blockType];
        if (blockCount > maxCount && blockType != Block.AIR) {
            maxCount = blockCount;
            planeBlock = blockType;
        }
    }

    return parseInt(planeBlock);
}

function getNeighbourBlockType(ocXStart, ocYStart, ocZStart, getBlock, neighbourComp, inverseQuality) {
    var sampleSizeArr = [inverseQuality, inverseQuality, inverseQuality];
    sampleSizeArr[neighbourComp] = 1;
    for (var ocX = ocXStart; ocX < sampleSizeArr[0] + ocXStart; ocX++) {
        for (var ocY = ocYStart; ocY < sampleSizeArr[1] + ocYStart; ocY++) {
            for (var ocZ = ocZStart; ocZ < sampleSizeArr[2] + ocZStart; ocZ++) {
                var adjBlock = getBlock(ocX, ocY, ocZ);
                if (adjBlock == Block.AIR) {
                    return Block.AIR;
                }
            }
        }
    }
    return Block.DIRT; //Any solid would do
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
        position: {
            itemSize: 3,
            array: vertsa,
            numItems: verts.length,
        },
        index: {
            itemSize: 1,
            array: indexa,
            numItems: indexes.length,
        },
        color: {
            itemSize: 3,
            array: colora,
            numItems: color.length,
        },
    };
    var offsets = [{
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

var LOOP = {};

//Loops starting at startPoint.x, .y, .z and loops
//the distance of spanVector.z, .y, .z on each axis,
//calling the callback with current THREE.Vector3 each iteration.
LOOP.For3D = function (startPoint, spanVector, callback) {
    for (var xOffset = 0; xOffset < spanVector.x; xOffset++) {
        for (var yOffset = 0; yOffset < spanVector.y; yOffset++) {
            for (var zOffset = 0; zOffset < spanVector.z; zOffset++) {
                var stop = callback(new THREE.Vector3(
                                startPoint.x + xOffset,
                                startPoint.y + yOffset,
                                startPoint.z + zOffset));

                if (stop) return;
            }
        }
    }
}

LOOP.For2D = function (startPoint, spanVector, callback) {
    for (var xOffset = 0; xOffset < spanVector.x; xOffset++) {
        for (var yOffset = 0; yOffset < spanVector.y; yOffset++) {
            var stop = callback(new THREE.Vector3(
                            startPoint.x + xOffset,
                            startPoint.y + yOffset));
            if (stop) return;
        }
    }
}