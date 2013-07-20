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
function greedyMesh(chunkGeometry, manager) {
    var chunkSize = new THREE.Vector3(CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH);
    var curChunkPos = new THREE.Vector3(chunkGeometry.cc.x, chunkGeometry.cc.y, chunkGeometry.cc.z);

    var r = 1 / chunkGeometry.quality;
    function mod(a, b) {
        return ((a % b) + b) % b;
    }
    function abs(n) {
        return Math.abs(n);
    }
    function clamp(n, a, b) {
        return Math.min(Math.max(n, a), b);
    }
    function noiseFunc(x, y, z) {
        function n(q) {
            return perlinNoise(Math.abs(x)/q, Math.abs(y)/q, Math.abs(z)/q);
        }
        var val = n(8) + n(32);
        if (abs(r - 4) > 0.001) val += n(4);
        if (abs(r - 2) > 0.001) val += n(2);
        return clamp(val/2 + 0.5, 0.0, 1.0);
    }

    var blocks = chunkGeometry.blocks;

    var verts = [];
    var blockTypes = []; //1 per face, which is 5 triangles, so 15 verts
    var faceNumbers = []; //same a blockTypes in size
    var index = []; //indexes into triangles of verts

    //Go over our blocks in 6 passes, 1 for every face (of a cube).
    //faceVector is the normal to the face.
    //faceComponents is an array of the components on the face, x=0, y=1, z=2
    //vecComponent is the number of the component of the normal
    var faceNumber = 0;
    LOOP.CubeFaces(function (faceVector, faceComponents, vecComponent) {
        var negFaceVector = faceVector.clone().multiplyScalar(-1);

        var startBlockPos = new THREE.Vector3(0, 0, 0);

        //Extend to the bounds of chunkSize with negFaceVector, so we
        //are iterating against the direction the faces are in.
        startBlockPos.multiplyVectors(chunkSize, negFaceVector);

        //We now loop over all the 2D planes that make up this face.
        //So for example, all the bottom sides when y = 0, then when y = 1, etc, etc.

        //We always use 'x' and 'y' terminology on this plane just for simplicities,
        //the face components say the real axis we are looping on, and use get/setComponent
        //on THREE.Vector3 to access the real values.

        var componentX = faceComponents[0]; //'x' (see above)
        var componentY = faceComponents[1]; //'y' (see above)
        var componentZ = vecComponent; //'z' (see above)

        var width = chunkSize.getComponent(componentX);
        var height = chunkSize.getComponent(componentY);
        var depth = chunkSize.getComponent(componentZ);

        var faceDirection = faceVector.getComponent(componentZ);

        function getPlaneBlock(plane, planePos) {
            return plane[planePos.x * width + planePos.y];
        }
        function setPlaneBlock(plane, planePos, blockValue) {
            plane[planePos.x * width + planePos.y] = blockValue;
        }

        function getOurBlock(x, y, z) {
            return chunkGeometry.blocks[
                x * CHUNK_WIDTH * CHUNK_HEIGHT +
                y * CHUNK_WIDTH +
                z
            ];
        }
        function getNeighbourBlock(chunk, x, y, z) {
            return chunk.block(x, y, z);
        }

        function getPixelatedBlockType(getBlock, blockPosStart, blockSize, adjacent) {
            //Ugh... have to sample to find the block
            var blockCounts = {};
            
            blockPosStart = blockPosStart.clone();

            //If we wanted to allow for say, inverseQuality of 3 (meaning the edges
            //are different size) this would be where we would do part of it... it would
            //make the chunk boundaries look bad though.

            var blockX = blockPosStart.x;
            var blockY = blockPosStart.y;
            var blockZ = blockPosStart.z;

            LOOP.For3D(new THREE.Vector3(0, 0, 0), blockSize,
                function(offset) {
                    var sampleBlockType = getBlock(blockX + offset.x, blockY + offset.y, blockZ + offset.z);
                    if(!blockCounts[sampleBlockType]) {
                        blockCounts[sampleBlockType] = 0;
                    }
                    blockCounts[sampleBlockType]++;
                }
            );

            //We make our block the most common block, excluding non-solid blocks.
            //However if we are all air, then we do become air (really we just don't
            //render).
            var maxCount = 0;
            var planeBlock = null; //Eh... slightly different than simpleMesher, but will result in the same thing.

            for(var blockType in blockCounts) {
                var blockCount = blockCounts[blockType];
                if(Block.isSolid(blockType)) {
                    if(blockCount > maxCount) {
                        maxCount = blockCount;
                        planeBlock = blockType;
                    }
                } else if(adjacent) {
                    //If it is adjacent any empty may manifest as their quality level may be anything, so
                    //this means we pretend the whole thing is empty so our quality level is independent of theirs.
                    return blockType;
                }
            }

            return planeBlock;
        }

        var quality = chunkGeometry.getQuality();
        var inverseQuality = 1 / quality;

        if(~~inverseQuality != inverseQuality) {
            //How big do you want us to make the pixelated chunks!
            throw "1/quality is not an integer, what do I do?";
        }

        //array of block types.
        var adjacentPlane = new Float32Array(width * height);
        var curPlane = new Float32Array(width * height);
        //Gives the blocks which have been added (ignores removed, so not REALLY delta, but close enough)
        var deltaPlane = new Float32Array(width * height);

        //quad is {startPoint (3D point though), endPoint (also 3D), blockType}
        var planeQuads = [];

        //We are going to need the adjacent chunk on at least one loop.
        var adjacentChunkPos = curChunkPos.clone();
        adjacentChunkPos.setComponent(componentZ, adjacentChunkPos.getComponent(componentZ) + faceDirection);
        var adjacentChunk = CallWithVector3(manager.chunkAt, adjacentChunkPos);

        function createPlane(plane, zValue, direction) {
            zValue += inverseQuality * direction;

            var zLength = inverseQuality;

            var subInverseQuality = inverseQuality;

            var adjacent = false;

            getBlock = getOurBlock;

            if(zValue < 0 || zValue >= depth) {
                if(adjacentChunk == null) {
                    for(var ix = 0; ix < width * height; ix++) {
                        plane[ix] = Block.DIRT; //Any solid would do here
                    }
                    return;
                }

                adjacent = true;
                getBlock = getNeighbourBlock.bind(null, adjacentChunk);
                zLength = 1;
                
                if(zValue < 0) {
                    zValue = depth - 1; //Must assume neighbour quality is 1, as it may change and our mesh still needs to work.
                } else if(zValue >= depth) {
                    zValue = 0; //We assume chunk size is divisible by inverseQuality
                }
            }

            if(~~subInverseQuality != subInverseQuality) {
                //How big do you want us to make the pixelated chunks!
                throw "1/quality is not an integer, what do I do?";
            }

            var blockSize = new THREE.Vector3(0, 0, 0);
            blockSize.setComponent(componentX, subInverseQuality);
            blockSize.setComponent(componentY, subInverseQuality);
            blockSize.setComponent(componentZ, zLength);

            for(var ix = 0; ix < width; ix += subInverseQuality) {
                for(var iy = 0; iy < height; iy += subInverseQuality) {
                    var planePos = new THREE.Vector2(ix, iy);

                    //Essentially handles the rotation from the plane coords to block coords
                    var blockPos = new THREE.Vector3(0, 0, 0);
                    blockPos.setComponent(componentX, ix);
                    blockPos.setComponent(componentY, iy);
                    blockPos.setComponent(componentZ, zValue);

                    var planeBlock;
                    if(inverseQuality == 1) {
                        planeBlock = CallWithVector3(getBlock, blockPos);
                        setPlaneBlock(plane, planePos, planeBlock);
                    } else {
                        planeBlock = getPixelatedBlockType(getBlock, blockPos, blockSize, adjacent);
                        //(chunk, blockPosStart, blockSize, adjacent)
                        //We can just ignore the other blocks as the greedymesher will ignore them.
                        setPlaneBlock(plane, planePos, planeBlock);
                    }
                }
            }
        }

        //We may double load these... but it makes the logic easier to understand.
        var curZ = 0;
        createPlane(curPlane, -inverseQuality, 0);
        createPlane(adjacentPlane, -inverseQuality, faceDirection);

        while(curZ < depth) {
            var tempPlane = adjacentPlane;
            adjacentPlane = curPlane;
            curPlane = tempPlane;

            if(faceDirection == 1) {
                //We always move up, and the faces are up, so the adjacentPlane is actually next
                //(well not current) plane. So we can just set it, and then recalculate the adjacentPlane
                //curPlane = adjacentPlane;

                createPlane(adjacentPlane, curZ, faceDirection);
            }
            else if(faceDirection == -1) {
                //The adjacentPlane is just the last plane.
                //adjacentPlane = curPlane;

                createPlane(curPlane, curZ, 0);
            } else {
                throw "Not possible";
            }

            //Find the delta plane
            //As all planes are the same size we can just do a 1 dimensional loop
            //Could increment by some amount of inverseQuality...
            for(var ix = 0; ix < width * height; ix++) {
                //No need make a face if the block adjacent to our face is filled,
                //or if we have no block.
                if(adjacentPlane[ix] && !Block.isEmpty(adjacentPlane[ix]) || !curPlane[ix] || Block.isEmpty(curPlane[ix])) {
                //if(!curPlane[ix] || Block.isEmpty(curPlane[ix])) {
                    deltaPlane[ix] = null;
                    continue;
                }

                deltaPlane[ix] = curPlane[ix];
            }

            //Now apply the actual greedy meshing to the deltaPlane
            GreedyMesh(planeQuads, deltaPlane, width, height, inverseQuality);

            curZ += inverseQuality;
        }

        //Adds quads to planeQuads array, where a quad is {startPoint, endPoint, blockType}
        function GreedyMesh(planeQuads, plane, width, height, inverseQuality) {
            //I expanded this loop so I can skip iterations when possible.
            for(var x = 0; x < width; x += inverseQuality) {
                for(var y = 0; y < height; y += inverseQuality) {
                    var curQuad = GetQuad(plane, x, y);
                    if(curQuad) {
                        planeQuads.push(curQuad);
                        //Remove all parts of the quad from the plane.
                        var curQuadSpan = curQuad.endPoint.clone().sub(curQuad.startPoint);
                        //Could only remove in increments of inverseQuality...
                        LOOP.For2D(curQuad.startPoint, curQuadSpan, 
                            function(planePos) {
                                setPlaneBlock(plane, planePos, null);
                            }
                        );

                        //We can also increment y by the height, which saves us checks later.
                        //May be slower though because it jumps the loop... idk...
                        y = curQuad.endPoint.y - inverseQuality;
                    }
                }
            }

            function GetQuad(plane, x, y) {
                var curQuadStart = new THREE.Vector3(x, y, curZ);
                var baseBlock = getPlaneBlock(plane, curQuadStart);

                //Meh, the extra check may not be right, but its late...
                if(!baseBlock || Block.isEmpty(baseBlock)) return;

                var curQuadEnd = new THREE.Vector3(x, y + inverseQuality, curZ);

                //Try to extend on the y axis
                while(curQuadEnd.y < height) {
                    var curBlock = getPlaneBlock(plane, curQuadEnd);
                    if(curBlock != baseBlock) break;

                    curQuadEnd.y += inverseQuality;
                }

                curQuadEnd.x += inverseQuality;
                
                //Try to extend on the x axis
                if(curQuadEnd.y - curQuadEnd.y == inverseQuality) {
                    //Simple, we have 1 height so width is easy to find
                    while(curQuadEnd.x < width) {
                        var curBlock = getPlaneBlock(plane, curQuadEnd);
                        if(curBlock != baseBlock) break;

                        //Could cause problems if chunk size is not divisible by inverseQuality.
                        curQuadEnd.x += inverseQuality;
                    }
                } else {
                    //A bit harder, when extending the width we have to make sure
                    //all of the multiple new squares added match the type.
                    while(curQuadEnd.x < width) {
                        var canExtend = true;
                        for(var yTestPos = curQuadStart.y; yTestPos < curQuadEnd.y; yTestPos += inverseQuality) {
                            var tempQuadEnd = new THREE.Vector3(curQuadEnd.x, yTestPos, 0);
                            var curBlock = getPlaneBlock(plane, tempQuadEnd);
                            if(curBlock != baseBlock) {
                                canExtend = false;
                                break;
                            }
                        }

                        if(!canExtend) break;

                        curQuadEnd.x += inverseQuality;
                    }
                }
                

                return {
                    startPoint: curQuadStart, 
                    endPoint: curQuadEnd, 
                    blockType: baseBlock
                };
            }
        }

        var worldChunkOffset = new THREE.Vector3().multiplyVectors(chunkSize, curChunkPos.clone());
        function convertBlockPosToWorldPos(blockPos) {
            blockPos.add(worldChunkOffset);
        }

        function planeCoordToBlockCoord(planePos) {
            var blockPos = new THREE.Vector3(0, 0, 0);
            blockPos.setComponent(componentX, planePos.x);
            blockPos.setComponent(componentY, planePos.y);
            blockPos.setComponent(componentZ, planePos.z);
            return blockPos;
        }

        //Now turn the planeQuads into vertices, colors, and indexes
        for(var ix = 0; ix < planeQuads.length; ix++) {
            //quad is {startPoint, endPoint, blockType}

            var curQuad = planeQuads[ix];

            addQuad(curQuad);

            function addQuad(curQuad) {
                var quadWidth = curQuad.endPoint.x - curQuad.startPoint.x;
                var quadHeight = curQuad.endPoint.y - curQuad.startPoint.y;

                var blockPos = curQuad.startPoint.clone();

                blockPos = planeCoordToBlockCoord(blockPos);

                //Offset normal axis based on block size.
                if(faceDirection == 1) {
                    addToComponent(blockPos, componentZ, inverseQuality);
                }

                //Not entirely sure, pretty sure this can be better explained.
                var counterClockwise = [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0.5, 0.5]
                ];
                var clockwise = [
                    [0, 1],
                    [1, 1],
                    [1, 0],
                    [0, 0],
                    [0.5, 0.5]
                ];

                //Yeah, this doesn't make sense...
                var faceIsClockwise = [false, true, true, false, false, true];

                var offsetArray = faceIsClockwise[faceNumber] ? clockwise : counterClockwise;

                var xCompOffset = blockPos.getComponent(componentX);
                var yCompOffset = blockPos.getComponent(componentY);
                var zCompOffset = blockPos.getComponent(componentZ);

                offsetArray.forEach(function(offsets) {
                    //Make some room
                    var iVertStart = verts.length;
                    verts.push(0, 0, 0);
                    var compXIndex = iVertStart + componentX;
                    var compYIndex = iVertStart + componentY;
                    var compZIndex = iVertStart + componentZ;

                    verts[compXIndex] = xCompOffset + quadWidth * offsets[0];
                    verts[compYIndex] = yCompOffset + quadHeight * offsets[1];
                    verts[compZIndex] = zCompOffset;

                    verts[iVertStart] += worldChunkOffset.x;
                    verts[iVertStart + 1] += worldChunkOffset.y;
                    verts[iVertStart + 2] += worldChunkOffset.z;
                });

                var blockType = curQuad.blockType;
                blockTypes.push(blockType);
                faceNumbers.push(faceNumber);
            }
        }

        faceNumber++;
    });

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
        index.push(iVert, iVert + 1, iVert + 4);
        index.push(iVert + 1, iVert + 2, iVert + 4);
        index.push(iVert + 2, iVert + 3, iVert + 4);
        index.push(iVert + 3, iVert, iVert + 4);
    }

    var color = [];

    for(var iFace = 0; iFace < verts.length / 15; iFace++) {
        var iVertexStart = iFace * 15;
        var blockType = blockTypes[iFace];
        var faceNumber = faceNumbers[iFace];

        var colours = Block.getColours(blockType, faceNumber);
        var c = colours.light;
        var c2 = colours.dark;

        for(var iTriangle = 0; iTriangle < 5; iTriangle++) {
            var iVS = iVertexStart;
            var noise = noiseFunc(verts[iVS], verts[iVS + 1], verts[iVS + 2]);

            var r = c.r*noise + c2.r*(1 - noise);
            var g = c.g*noise + c2.g*(1 - noise);
            var b = c.b*noise + c2.b*(1 - noise);
            color.push(r/255, g/255, b/255);

            iVertexStart += 3;
        }
    }

    var indexa = new Uint16Array(index.length);
    copy(index, indexa);

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
            numItems: index.length,
        },
        color: {
            itemSize: 3,
            array: colora,
            numItems: color.length,
        },
    };
    var offsets = [{
        start: 0,
        count: index.length,
        index: 0,
    }];

    return {
        attributes: attributes,
        offsets: offsets,
        transferables: [vertsa.buffer, indexa.buffer, colora.buffer],
    };
}
