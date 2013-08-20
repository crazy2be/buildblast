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
function greedyMesh2(chunkGeometry, manager) {
    //Should probably turn chunkGeometry.cc into a Vector3, so I don't have to do this copy.
    var curChunkPos = new THREE.Vector3(chunkGeometry.cc.x, chunkGeometry.cc.y, chunkGeometry.cc.z);

    var bcxStart = CHUNK_WIDTH * chunkGeometry.cc.x;
    var bcyStart = CHUNK_HEIGHT * chunkGeometry.cc.y;
    var bczStart = CHUNK_DEPTH * chunkGeometry.cc.z;

    var verts = []; //Each vertice is made of 3 integers (3D point)
    var blockTypes = []; //1 per face, which is has 5 points, so 15 verts
    var faceNumbers = []; //same a blockTypes in size
    var indexes = []; //indexes for triangles of points in verts

    //Go over our blocks in 6 passes, 1 for every face (of a cube).

    //The order is important here! It makes sure the normals line up with the 'face numbers' given
    //by Block.getColors.

    for (var iSide = 0; iSide < 6; iSide++) {
        var faceDirection = LOOP_CUBEFACES_DATA[iSide][0];
        var componentX = LOOP_CUBEFACES_DATA[iSide][1]; //'x' (see above)
        var componentY = LOOP_CUBEFACES_DATA[iSide][2]; //'y' (see above)
        var componentZ = LOOP_CUBEFACES_DATA[iSide][3]; //'z' (see above)

        var width = CHUNK_WIDTH;
        var height = CHUNK_HEIGHT;
        var depth = CHUNK_DEPTH;

        var inverseQuality = 1 / chunkGeometry.quality;

        function createPlane(plane, zValue) {
            var rotArr = [0, 0, 0]; //Used to apply rotation

            for (var ix = 0; ix < width; ix += inverseQuality) {
                for (var iy = 0; iy < height; iy += inverseQuality) {
                    //Essentially handles the rotation from the plane coords to block coords
                    rotArr[componentX] = ix;
                    rotArr[componentY] = iy;
                    rotArr[componentZ] = zValue;

                    var planeBlock;
                    if (inverseQuality == 1) {
                        planeBlock = chunkGeometry.blocks[
                            rotArr[0] * CHUNK_WIDTH * CHUNK_HEIGHT +
                            rotArr[1] * CHUNK_WIDTH +
                            rotArr[2]
                        ];
                    } else {
                        planeBlock = getPixelatedBlockType(rotArr[0], rotArr[1], rotArr[2], inverseQuality, chunkGeometry.blocks);
                        //(chunk, blockPosStart, blockSize, adjacent)
                        //We can just ignore the other blocks as the greedymesher will ignore them.
                    }

                    plane[(ix * width / inverseQuality + iy) / inverseQuality] = planeBlock;
                }
            }
        }

        function GreedyMesh(planeQuads, plane, width, height, inverseQuality, curZ) {
            //I expanded this loop so I can skip iterations when possible.
            for (var x = 0; x < width; x += inverseQuality) {
                for (var y = 0; y < height; y += inverseQuality) {
                    //The current end of the rectangle (exclusive)
                    var px = x;
                    var py = y;

                    //Do a quick check to make sure we are not just empty
                    var baseBlock = plane[(px * width / inverseQuality + py) / inverseQuality];
                    if (baseBlock == Block.AIR) continue;

                    py += inverseQuality;

                    //Try to extend on the y axis
                    while (py < height) {
                        var curBlock = plane[(px * width / inverseQuality + py) / inverseQuality];
                        if (curBlock != baseBlock) break;

                        py += inverseQuality;
                    }

                    px += inverseQuality;

                    //Try to extend on the x axis
                    while (px < width) {
                        //For every 1 we extend it, we have to check the entire new column
                        for (var pyTest = y; pyTest < py; pyTest += inverseQuality) {
                            var curBlock = plane[(px * width / inverseQuality + pyTest) / inverseQuality];
                            if (curBlock != baseBlock) break;
                        }

                        //Did not match all blocks in the column
                        if (pyTest != py) break;

                        px += inverseQuality;
                    }

                    planeQuads.push([
                        x, y, curZ,
                        (px - x), (py - y),
                        baseBlock
                    ]);

                    //Remove all parts of the quad from the plane.

                    for (var pox = 0; pox < (px - x); pox += inverseQuality) {
                        for (var poy = 0; poy < (py - y); poy += inverseQuality) {
                            plane[((x + pox) * width / inverseQuality + (y + poy)) / inverseQuality] = Block.AIR;
                        }
                    }

                    //We can also increment y by the height, which saves us checks later.
                    //May be slower though because it jumps the loop... idk...
                    //y = py - inverseQuality;
                }
            }
        }
        function SimpleMesh(planeQuads, plane, width, height, inverseQuality, curZ) {
            //I expanded this loop so I can skip iterations when possible.
            for (var x = 0; x < width; x += inverseQuality) {
                for (var y = 0; y < height; y += inverseQuality) {
                    var baseBlock = plane[(x * width / inverseQuality + y) / inverseQuality];

                    if (baseBlock == Block.AIR) continue;

                    var curQuad = [
                        x, y, curZ,
                        inverseQuality, inverseQuality,
                        baseBlock
                    ];

                    planeQuads.push(curQuad);
                }
            }
        }

        //array of block types.
        var adjacentPlane = new Float32Array(width * height / inverseQuality / inverseQuality);
        var curPlane = new Float32Array(width * height / inverseQuality / inverseQuality);
        //Gives the blocks which have been added (ignores removed, so not REALLY delta, but close enough)
        var deltaPlane = new Float32Array(width * height / inverseQuality / inverseQuality);

        //quad is [ox, oy, oz, xSize, ySize, blockType]
        var planeQuads = [];

        //We are going to need the adjacent chunk on at least one loop.
        var adjacentChunkPos = curChunkPos.clone();
        adjacentChunkPos.setComponent(componentZ, adjacentChunkPos.getComponent(componentZ) + faceDirection);
        var adjacentChunk = CallWithVector3(manager.chunkAt, adjacentChunkPos);

        //Start off beyond the bounds, and then go back in the bounds inside the loop
        var curZ;
        var zBound;
        //We go 1 into our neighbour, as we assume their inverseQuality is 1
        if (faceDirection == -1) {
            curZ = depth - 1; //This is not entirely correct, it should be size[componentZ]
        } else {
            curZ = 0;
        }

        if (adjacentChunk == null) {
            for (var ix = 0; ix < width; ix += inverseQuality) {
                for (var iy = 0; iy < height; iy += inverseQuality) {
                    var index = (ix * width / inverseQuality + iy) / inverseQuality;
                    adjacentPlane[index] = Block.DIRT; //Any solid would do here
                }
            }
        } else {
            for (var ix = 0; ix < width; ix += inverseQuality) {
                for (var iy = 0; iy < height; iy += inverseQuality) {
                    //Handles the rotation from the plane coords to block coords
                    var oArr = [0, 0, 0];
                    oArr[componentX] = ix;
                    oArr[componentY] = iy;
                    oArr[componentZ] = curZ;

                    var getBlock = adjacentChunk.block;
                    var planeBlock = getNeighbourBlockType(oArr[0], oArr[1], oArr[2], getBlock, componentZ, inverseQuality);

                    adjacentPlane[(ix * width / inverseQuality + iy) / inverseQuality] = planeBlock;
                }
            }
        }

        if (faceDirection == -1) {
            curZ = 0;
            zBound = depth;
        } else {
            curZ = depth - inverseQuality;
            zBound = -inverseQuality;
        }

        while (curZ != zBound) {
            createPlane(curPlane, curZ);

            //Find the delta plane
            for (var ix = 0; ix < width; ix += inverseQuality) {
                for (var iy = 0; iy < height; iy += inverseQuality) {
                    //No need make a face if the block adjacent to our face is filled,
                    //or if we have no block.
                    var index = (ix * width / inverseQuality + iy) / inverseQuality;

                    if (adjacentPlane[index] != Block.AIR || curPlane[index] == Block.AIR) {
                        deltaPlane[index] = Block.AIR;
                        continue;
                    }

                    deltaPlane[index] = curPlane[index];
                }
            }

            //Now apply the actual greedy meshing to the deltaPlane
            GreedyMesh(planeQuads, deltaPlane, width, height, inverseQuality, curZ);
            //SimpleMesh(planeQuads, deltaPlane, width, height, inverseQuality, curZ);

            //The curPlane becomes the adjacentPlane
            var temp = curPlane;
            curPlane = adjacentPlane;
            adjacentPlane = temp;

            //Go opposite the face direction
            curZ -= inverseQuality * faceDirection;
        }

        var rotArr = [0, 0, 0];
        //Now turn the planeQuads into vertices, colors, and indexes
        for (var ix = 0; ix < planeQuads.length; ix++) {
            var quad = planeQuads[ix];
            rotArr[componentX] = quad[0];
            rotArr[componentY] = quad[1];
            rotArr[componentZ] = quad[2];
            addQuad(rotArr[0] + bcxStart, rotArr[1] + bcyStart, rotArr[2] + bczStart, quad[3], quad[4], componentZ, faceDirection, inverseQuality, verts);
            blockTypes.push(quad[5]);
            faceNumbers.push(iSide);
        }
    }

    return generateGeometry(verts, blockTypes, faceNumbers, indexes, inverseQuality);
}
