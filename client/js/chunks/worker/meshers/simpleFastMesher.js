function simpleMesh2(cg, manager) {
    var chunkGeometry = cg;

    var cw = CHUNK_WIDTH;
    var ch = CHUNK_HEIGHT;
    var cd = CHUNK_DEPTH;

    var ccArr = [cg.cc.x, cg.cc.y, cg.cc.z];

    var bcxStart = CHUNK_WIDTH * chunkGeometry.cc.x;
    var bcyStart = CHUNK_HEIGHT * chunkGeometry.cc.y;
    var bczStart = CHUNK_DEPTH * chunkGeometry.cc.z;

    var verts = []; //Each vertice is made of 3 integers (3D point)
    var blockTypes = []; //1 per face, which is has 5 points, so 15 verts
    var faceNumbers = []; //same a blockTypes in size
    var indexes = []; //indexes for triangles of points in verts

    var inverseQuality = 1 / chunkGeometry.quality;

    function addBlockGeometry(ox, oy, oz, inverseQuality) {
        var noise = [];
        var ourBlockType = getPixelatedBlockType(ox, oy, oz, inverseQuality, chunkGeometry.blocks);
        if (ourBlockType == Block.AIR) return;

        var oMax = [CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH];

        //See meshCommon.js for more explanation of LOOP_CUBEFACES_DATA and mnemonics used.

        for(var iFace = 0; iFace < 6; iFace++) {
            var faceDirection = LOOP_CUBEFACES_DATA[iFace][0];
            var componentX = LOOP_CUBEFACES_DATA[iFace][1]; //'x' (see above)
            var componentY = LOOP_CUBEFACES_DATA[iFace][2]; //'y' (see above)
            var componentZ = LOOP_CUBEFACES_DATA[iFace][3]; //'z' (see above)

            var oAdjArr = [ox, oy, oz];
            oAdjArr[componentZ] += faceDirection * inverseQuality;

            //We assume it's dirt if we cannot access an adjacent chunk
            var adjacentBlock = Block.DIRT;
            if(oAdjArr[componentZ] < 0 || oAdjArr[componentZ] >= oMax[componentZ]) {
                //Off the edge, so we need to check our neighbour... ugh...

                if(oAdjArr[componentZ] < 0) {
                    oAdjArr[componentZ] = oMax[componentZ] - 1;
                }
                if(oAdjArr[componentZ] >= oMax[componentZ]) {
                    oAdjArr[componentZ] = 0;
                }

                ccArr[componentZ] += faceDirection;
                var neighbourChunk = manager.chunkAt(ccArr[0], ccArr[1], ccArr[2]);
                ccArr[componentZ] -= faceDirection;

                if(neighbourChunk) {
                    adjacentBlock = getNeighbourBlockType(oAdjArr[0], oAdjArr[1], oAdjArr[2], 
                                          neighbourChunk.block, componentZ, inverseQuality);
                }
            } else {
                if(inverseQuality === 1) {
                    adjacentBlock = chunkGeometry.blocks[
                        oAdjArr[0] * CHUNK_WIDTH * CHUNK_HEIGHT +
                        oAdjArr[1] * CHUNK_WIDTH +
                        oAdjArr[2]
                    ];
                } else {
                    adjacentBlock = getPixelatedBlockType(oAdjArr[0], oAdjArr[1], oAdjArr[2], inverseQuality, chunkGeometry.blocks);
                }
            }
            if(adjacentBlock == Block.AIR) {
                addQuad(ox + bcxStart, oy + bcyStart, oz + bczStart, inverseQuality, inverseQuality, componentZ, faceDirection, inverseQuality, verts);
                blockTypes.push(ourBlockType);
                faceNumbers.push(iFace);
            }
        }
    }

    //Pick blocks in increments based on the quality (like sampling), later code will look through the
    //area and decide what type the block should really be.
    for (var ox = 0; ox < cw; ox += inverseQuality) {
        for (var oy = 0; oy < ch; oy += inverseQuality) {
            for (var oz = 0; oz < cd; oz += inverseQuality) {
                addBlockGeometry(ox, oy, oz, inverseQuality);
            }
        }
    }

    return generateGeometry(verts, blockTypes, faceNumbers, indexes, inverseQuality);
}
