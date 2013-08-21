function simpleMesh2(blocks, quality, cc, manager) {
    var cw = CHUNK_WIDTH;
    var ch = CHUNK_HEIGHT;
    var cd = CHUNK_DEPTH;

    var chunkDims = [cw, ch, cd];

    preprocessBlocks(blocks, chunkDims);

    var ccArr = [cc.x, cc.y, cc.z];

    var bcxStart = CHUNK_WIDTH * cc.x;
    var bcyStart = CHUNK_HEIGHT * cc.y;
    var bczStart = CHUNK_DEPTH * cc.z;

    var verts = []; //Each vertice is made of 3 integers (3D point)
    var blockTypes = []; //1 per face, which is has 5 points, so 15 verts
    var faceNumbers = []; //same a blockTypes in size
    var indexes = []; //indexes for triangles of points in verts

    var inverseQuality = 1 / quality;

    function addBlockGeometry(ocX, ocY, ocZ, inverseQuality) {
        var noise = [];
        var ourBlockType = getVoxelatedBlockType(ocX, ocY, ocZ, inverseQuality, blocks);
        if (ourBlockType == Block.AIR) return;

        var oMax = [CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH];

        //See meshCommon.js for more explanation of LOOP_CUBEFACES_DATA and mnemonics used.

        for(var iFace = 0; iFace < 6; iFace++) {
            var faceDirection = LOOP_CUBEFACES_DATA[iFace][0];
            var compX = LOOP_CUBEFACES_DATA[iFace][1]; //'x' (see above)
            var compY = LOOP_CUBEFACES_DATA[iFace][2]; //'y' (see above)
            var compZ = LOOP_CUBEFACES_DATA[iFace][3]; //'z' (see above)

            var oAdjArr = [ocX, ocY, ocZ];
            oAdjArr[compZ] += faceDirection * inverseQuality;

            var adjacentBlocks = getBlockData(manager, blocks, ccArr, oAdjArr, compZ);

            //We assume it's dirt if we cannot access an adjacent chunk
            var adjacentBlock = Block.DIRT;
            if (adjacentBlocks != blocks) {
                if (adjacentBlocks) {
                    adjacentBlock = getNeighbourBlockType(oAdjArr[0], oAdjArr[1], oAdjArr[2],
                                        adjacentBlocks, compZ, inverseQuality);
                }
            } else {
                if(inverseQuality === 1) {
                    adjacentBlock = blocks[
                        oAdjArr[0] * CHUNK_WIDTH * CHUNK_HEIGHT +
                        oAdjArr[1] * CHUNK_WIDTH +
                        oAdjArr[2]
                    ];
                } else {
                    adjacentBlock = getVoxelatedBlockType(oAdjArr[0], oAdjArr[1], oAdjArr[2], inverseQuality, blocks);
                }
            }
            if(adjacentBlock == Block.AIR) {
                addQuad(ocX + bcxStart, ocY + bcyStart, ocZ + bczStart, inverseQuality, inverseQuality, compZ, faceDirection, inverseQuality, verts);
                blockTypes.push(ourBlockType);
                faceNumbers.push(iFace);
            }
        }
    }

    //Pick blocks in increments based on the quality (like sampling), later code will look through the
    //area and decide what type the block should really be.
    for (var ocX = 0; ocX < cw; ocX += inverseQuality) {
        for (var ocY = 0; ocY < ch; ocY += inverseQuality) {
            for (var ocZ = 0; ocZ < cd; ocZ += inverseQuality) {
                addBlockGeometry(ocX, ocY, ocZ, inverseQuality);
            }
        }
    }

    return generateGeometry(verts, blockTypes, faceNumbers, indexes, inverseQuality);
}


