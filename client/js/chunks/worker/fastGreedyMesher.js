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
function fastGreedyMesh(chunkGeometry, manager) {
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

    var verts = []; //Each vertice is made of 3 integers (3D point)
    var blockTypes = []; //1 per face, which is has 5 points, so 15 verts
    var faceNumbers = []; //same a blockTypes in size
    var indexes = []; //indexes for triangles of points in verts

    //Go over our blocks in 6 passes, 1 for every face (of a cube).
    //faceVector is the normal to the face.
    //faceComponents is an array of the components on the face, x=0, y=1, z=2
    //vecComponent is the number of the component of the normal

    //Face normal, components of face, component of normal (same as THREE.js, x=0, y=1, z=2)
    //The order is important here! It makes sure the normals line up with the 'face numbers' given
    //by Block.getColors.

    var LOOP_CUBEFACES_DATA = [
    //Face normal, components of face, component of normal (same as THREE.js, x=0, y=1, z=2)
    //The order is important here! It makes sure the normals line up with the 'face numbers' given
    //by Block.getColors.
        [new THREE.Vector3(1, 0, 0), [1, 2], 0],
        [new THREE.Vector3(-1, 0, 0), [1, 2], 0],
        [new THREE.Vector3(0, 1, 0), [0, 2], 1],
        [new THREE.Vector3(0, -1, 0), [0, 2], 1],
        [new THREE.Vector3(0, 0, 1), [0, 1], 2],
        [new THREE.Vector3(0, 0, -1), [0, 1], 2],
    ];

    for(var iSide = 0; iSide < 6; iSide++) {
        var faceVector = LOOP_CUBEFACES_DATA[iSide][0];
        var faceComponents = LOOP_CUBEFACES_DATA[iSide][1];
        var vecComponent = LOOP_CUBEFACES_DATA[iSide][2];

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

        var quality = chunkGeometry.quality;
        var inverseQuality = 1 / quality;

        if(~~inverseQuality != inverseQuality) {
            //How big do you want us to make the pixelated chunks!
            throw "1/quality is not an integer, what do I do?";
        }

        function getPlaneBlock(plane, planePos) {
            return plane[(planePos.x * width / inverseQuality + planePos.y) / inverseQuality];
        }
        function setPlaneBlock(plane, planePos, blockValue) {
            plane[(planePos.x * width / inverseQuality + planePos.y) / inverseQuality] = blockValue;
        }

        function getPixelatedBlockType(oxStart, oyStart, ozStart) {
            //Ugh... have to sample to find the block
            var blockCounts = {};
            
            //If we wanted to allow for say, inverseQuality of 3 (meaning the edges
            //are different size) this would be where we would do part of it... it would
            //make the chunk boundaries look bad though.

            var oxEnd = oxStart + inverseQuality;
            var oyEnd = oyStart + inverseQuality;
            var ozEnd = ozStart + inverseQuality;

            for(var ox = oxStart; ox < oxEnd; ox++) {
                for(var oy = oyStart; oy < oyEnd; oy++) {
                    for(var oz = ozStart; oz < ozEnd; oz++) {
                        var sampleBlockType = chunkGeometry.blocks[
                            ox * CHUNK_WIDTH * CHUNK_HEIGHT +
                            oy * CHUNK_WIDTH +
                            oz
                        ];
                        if(!blockCounts[sampleBlockType]) {
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

            for(var blockType in blockCounts) {
                var blockCount = blockCounts[blockType];
                if(blockType != Block.AIR) {
                    if(blockCount > maxCount) {
                        maxCount = blockCount;
                        planeBlock = blockType;
                    }
                }
            }

            return planeBlock;
        }

        function createPlane(plane, zValue) {
            var rotArr = []; //Used to apply rotation
            rotArr[0] = 0;
            rotArr[1] = 0;
            rotArr[2] = 0;

            for(var ix = 0; ix < width; ix += inverseQuality) {
                for(var iy = 0; iy < height; iy += inverseQuality) {
                    //Essentially handles the rotation from the plane coords to block coords
                    rotArr[componentX] = ix;
                    rotArr[componentY] = iy;
                    rotArr[componentZ] = zValue;

                    var planeBlock;
                    if(inverseQuality == 1) {
                        planeBlock = chunkGeometry.blocks[
                            rotArr[0] * CHUNK_WIDTH * CHUNK_HEIGHT +
                            rotArr[1] * CHUNK_WIDTH +
                            rotArr[2]
                        ];
                    } else {
                        planeBlock = getPixelatedBlockType(rotArr[0], rotArr[1], rotArr[2]);
                        //(chunk, blockPosStart, blockSize, adjacent)
                        //We can just ignore the other blocks as the greedymesher will ignore them.
                    }

                    plane[(ix * width / inverseQuality + iy) / inverseQuality] = planeBlock;
                }
            }
        }

        //Adds quads to planeQuads array, where a quad is {startPoint, endPoint, blockType}
        function GreedyMesh(planeQuads, plane, width, height, inverseQuality, curZ) {
            //I expanded this loop so I can skip iterations when possible.
            for(var x = 0; x < width; x += inverseQuality) {
                for(var y = 0; y < height; y += inverseQuality) {
                    var curQuad = GetQuad(plane, x, y);
                    if(curQuad) {
                        planeQuads.push(curQuad);
                        //Remove all parts of the quad from the plane.
                        var curQuadSpan = curQuad.endPoint.clone().sub(curQuad.startPoint);
                        //Could only remove in increments of inverseQuality if we wanted...
                        LOOP.For2D(curQuad.startPoint, curQuadSpan, 
                            function(planePos) {
                                setPlaneBlock(plane, planePos, Block.AIR);
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

                if(baseBlock == Block.AIR) return;

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
        function SimpleMesh(planeQuads, plane, width, height, inverseQuality, curZ) {
            //I expanded this loop so I can skip iterations when possible.
            for(var x = 0; x < width; x += inverseQuality) {
                for(var y = 0; y < height; y += inverseQuality) {
                    var curQuadStart = new THREE.Vector3(x, y, curZ);
                    var curQuadEnd = new THREE.Vector3(x + inverseQuality, y + inverseQuality, curZ + 1);
                    var baseBlock = getPlaneBlock(plane, curQuadStart);

                    if(baseBlock == Block.AIR) continue;

                    var curQuad = {
                        startPoint: curQuadStart, 
                        endPoint: curQuadEnd, 
                        blockType: baseBlock                        
                    };

                    planeQuads.push(curQuad);
                }
            }
        }

        var worldChunkOffset = new THREE.Vector3().multiplyVectors(chunkSize, curChunkPos.clone());
        function addQuad(curQuad, iFace) {
            var quadWidth = curQuad.endPoint.x - curQuad.startPoint.x;
            var quadHeight = curQuad.endPoint.y - curQuad.startPoint.y;

            var planePos = curQuad.startPoint.clone();

            var blockPos = new THREE.Vector3();

            blockPos.setComponent(componentX, planePos.x);
            blockPos.setComponent(componentY, planePos.y);
            blockPos.setComponent(componentZ, planePos.z);

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
            //var faceIsClockwise = [true, false, false, true, true, false];

            var offsetArray = faceIsClockwise[iSide] ? clockwise : counterClockwise;

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
            faceNumbers.push(iFace);
        }

        //array of block types.
        var adjacentPlane = new Float32Array(width * height / inverseQuality / inverseQuality);
        var curPlane = new Float32Array(width * height / inverseQuality / inverseQuality);
        //Gives the blocks which have been added (ignores removed, so not REALLY delta, but close enough)
        var deltaPlane = new Float32Array(width * height / inverseQuality / inverseQuality);

        //quad is {startPoint (3D point though), endPoint (also 3D), blockType}
        var planeQuads = [];

        //We are going to need the adjacent chunk on at least one loop.
        var adjacentChunkPos = curChunkPos.clone();
        adjacentChunkPos.setComponent(componentZ, adjacentChunkPos.getComponent(componentZ) + faceDirection);
        var adjacentChunk = CallWithVector3(manager.chunkAt, adjacentChunkPos);

        //Start off beyond the bounds, and then go back in the bounds inside the loop
        var curZ;
        var zBound;
        //We go 1 into our neighbour, as we assume their inverseQuality is 1
        if(faceDirection == -1) {
            curZ = depth - 1;
        } else {
            curZ = 0;
        }

        if(adjacentChunk == null) {
            for(var ix = 0; ix < width; ix += inverseQuality) {
                for(var iy = 0; iy < height; iy += inverseQuality) {
                    var index = (ix * width / inverseQuality + iy) / inverseQuality;
                    adjacentPlane[index] = Block.DIRT; //Any solid would do here
                }
            }
        } else {
            var blockSize = new THREE.Vector3(0, 0, 0);
            blockSize.setComponent(componentX, inverseQuality);
            blockSize.setComponent(componentY, inverseQuality);
            blockSize.setComponent(componentZ, 1); //We must assume our neighbours have inverseQuality of 1

            for(var ix = 0; ix < width; ix += inverseQuality) {
                for(var iy = 0; iy < height; iy += inverseQuality) {
                    //Essentially handles the rotation from the plane coords to block coords
                    var blockPos = new THREE.Vector3(0, 0, 0);
                    blockPos.setComponent(componentX, ix);
                    blockPos.setComponent(componentY, iy);
                    blockPos.setComponent(componentZ, curZ);

                    var getBlock = adjacentChunk.block;
                    var planeBlock = Block.DIRT; //Any solid block would do here
                    if(inverseQuality == 1) {
                        planeBlock = CallWithVector3(getBlock, blockPos);
                    } else {
                        LOOP.For3D(blockPos, blockSize, function(pos) {
                            if(CallWithVector3(getBlock, pos) == Block.AIR) {
                                planeBlock = Block.AIR; //If any of the blocks are not solid, then we pretend its all not solid, so our face is solid
                                return true; //stop
                            }
                        });
                    }

                    adjacentPlane[(ix * width / inverseQuality + iy) / inverseQuality] = planeBlock;
                }
            }
        }

        if(faceDirection == -1) {
            curZ = 0;
            zBound = depth;
        } else {
            curZ = depth - inverseQuality;
            zBound = -inverseQuality;
        }

        while(curZ != zBound) {
            createPlane(curPlane, curZ);

            //Find the delta plane
            for(var ix = 0; ix < width; ix += inverseQuality) {
                for(var iy = 0; iy < height; iy += inverseQuality) {
                    //No need make a face if the block adjacent to our face is filled,
                    //or if we have no block.
                    var index = (ix * width / inverseQuality + iy) / inverseQuality;

                    //if(!Block.isEmpty(adjacentPlane[index]) || Block.isEmpty(curPlane[index])) {
                    if(adjacentPlane[index] != Block.AIR || curPlane[index] == Block.AIR) {
                        deltaPlane[index] = Block.AIR;
                        continue;
                    }

                    deltaPlane[index] = curPlane[index];
                }
            }

            //Now apply the actual greedy meshing to the deltaPlane
            //GreedyMesh(planeQuads, deltaPlane, width, height, inverseQuality, curZ);
            SimpleMesh(planeQuads, deltaPlane, width, height, inverseQuality, curZ);

            //The curPlane becomes the adjacentPlane
            var temp = curPlane;
            curPlane = adjacentPlane;
            adjacentPlane = temp;

            //Go opposite the face direction
            curZ -= inverseQuality * faceDirection;
        }

        //Now turn the planeQuads into vertices, colors, and indexes
        for(var ix = 0; ix < planeQuads.length; ix++) {
            addQuad(planeQuads[ix], iSide);
        }
    }

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
            var noise = noiseFunc(verts[iVS], verts[iVS + 1], verts[iVS + 2]);

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
