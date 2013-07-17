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
    var chunkSize = new THREE.Vector3(CHUNK_WIDTH, CHUNK_DEPTH, CHUNK_HEIGHT);
    var curChunkPos = new THREE.Vector3(chunkGeometry.cc.x, chunkGeometry.cc.y, chunkGeometry.cc.z);

    var verts = [];
    var index = [];
    var color = [];
    var noise = [];

    var r = 1 / chunkGeometry.quality;
    function mod(a, b) {
        return ((a % b) + b) % b;
    }
    function abs(n) {
        return Math.abs(n);
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

    function addVert(x, y, z) {
        verts.push(x, y, z);
        noise.push(noiseFunc(x, y, z));
    }

    function addFace(face, blockType) {
        var l = verts.length / 3;
        // Each face is made up of two triangles
        index.push(l-5, l-4, l-1);
        index.push(l-4, l-3, l-1);
        index.push(l-3, l-2, l-1);
        index.push(l-2, l-5, l-1);

        var c, c2;
        var colours = Block.getColours(blockType, face);
        c = colours.light;
        c2 = colours.dark;

        for (var i = 0; i < 5; i++) {
            var n = noise.shift();
            var r = c.r*n + c2.r*(1 - n);
            var g = c.g*n + c2.g*(1 - n);
            var b = c.b*n + c2.b*(1 - n);
            color.push(r/255, g/255, b/255);
        }
    }

    var blocks = chunkGeometry.blocks;

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

        function getPixelatedBlockType(chunk, blockPos, inverseQuality) {
            //Ugh... have to sample to find the block
            var blockCounts = {};

            //If we wanted to allow for say, inverseQuality of 3 (meaning the edges
            //are different size) this would be where we would do part of it... it would
            //make the chunk boundaries look bad though.
                        
            LOOP.For3D(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1).multiplyScalar(inverseQuality),
                function(offset) {
                    var sampleBlockPos = blockPos.clone().add(offset);
                    var sampleBlockType = CallWithVector3(chunk.block, sampleBlockPos);
                    if(!blockCounts[sampleBlockType]) {
                        blockCounts[sampleBlockType] = 0;
                    }
                    blockCounts[sampleBlockType]++;
                }
            );

            //We make our block the most common block, excluding air.
            //However if we are all air, then we do become air (really we just don't
            //render).
            var maxCount = 0;
            var planeBlock = null; //Eh... slightly different than simpleMesher, but will result in the same thing.

            for(var blockType in blockCounts) {
                var blockCount = blockCounts[blockType];
                if(blockCount > maxCount) {
                    maxCount = blockCount;
                    planeBlock = blockType;
                }
            }

            return planeBlock;
        }

        function createPlane(plane, chunk, zValue) {
            if(chunk == null) {
                for(var ix = 0; ix < width * height; ix++) {
                    plane[ix] = null;
                }
                return;
            }
            
            //Could be calling a ChunkGeometry or just a Chunk.
            var quality = chunk.getQuality();
            var inverseQuality = 1 / quality;
    
            if(~~inverseQuality != inverseQuality) {
                //How big do you want us to make the pixelated chunks!
                throw "1/quality is not an integer, what do I do?";
            }

            for(var ix = 0; ix < width; ix += inverseQuality) {
                for(var iy = 0; iy < height; iy += inverseQuality) {
                    var planePos = new THREE.Vector2(ix, iy);

                    //Essentially handles the rotation from the plane coords to block coords
                    var blockPos = new THREE.Vector3(0, 0, 0);
                    blockPos.setComponent(componentX, ix);
                    blockPos.setComponent(componentY, iy);
                    blockPos.setComponent(componentZ, zValue);

                    var planeBlock;
                    if(inverseQuality == 1) {
                        planeBlock = CallWithVector3(chunk.block, blockPos);
                        setPlaneBlock(plane, planePos, planeBlock);
                    } else {
                        planeBlock = getPixelatedBlockType(chunk, blockPos, inverseQuality);
                        //This a mildly inefficient way to deal with quality... but w/e,
                        //we just set all the squares, and then later make sure our greedy mesher
                        //works in the same scale as our quality.
                        LOOP.For2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 1).multiplyScalar(inverseQuality),
                            function(offset) {
                                var samplePlanePos = planePos.clone().add(offset);
                                setPlaneBlock(plane, samplePlanePos, planeBlock);
                            }
                        );
                    }
                }
            }
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

        //Usually gets our chunk... but gets the adjacentChunk on edge cases.
        function getChunkAtZ(zValue) {
            if(zValue < 0 || zValue > depth) {
                return adjacentChunk;
            }
            return chunkGeometry;
        }

        //We may double load these... but it makes the logic easier to understand.
        var curZ = 0;
        createPlane(curPlane, getChunkAtZ(-inverseQuality), -inverseQuality);
        createPlane(adjacentPlane, getChunkAtZ(-inverseQuality + faceDirection), -inverseQuality + faceDirection);

        while(curZ < depth) {
            if(faceDirection == 1) {
                //We always move up, and the faces are up, so the adjacentPlane is actually next
                //(well not current) plane. So we can just set it, and then recalculate the adjacentPlane
                curPlane = adjacentPlane;

                createPlane(adjacentPlane, getChunkAtZ(curZ + faceDirection), curZ);
            }
            else if(faceDirection == -1) {
                //The adjacentPlane is just the last plane.
                adjacentPlane = curPlane;

                createPlane(curPlane, chunkGeometry, curZ);
            } else {
                throw "Not possible";
            }

            //Find the delta plane
            //As all planes are the same size we can just do a 1 dimensional loop
            for(var ix = 0; ix < width * height; ix++) {
                //No need make a face if the block adjacent to our face is filled,
                //or if we have no block.
                //if(!Block.isEmpty(adjacentPlane[ix]) || Block.isEmpty(curPlane[ix])) {
                if(Block.isEmpty(curPlane[ix])) {
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
                for(var y = 0; y < height;) {
                    var curQuad = GetQuad(plane, x, y);
                    if(curQuad) {
                        planeQuads.push(curQuad);
                        //Remove all parts of the quad from the plane.
                        LOOP.For2D(curQuad.startPoint, curQuad.endPoint, 
                            function(planePos) {
                                setPlaneBlock(plane, planePos, null);
                            }
                        );

                        //We can also increment y by the height, which saves us checks later.
                        //May be slower though because it jumps the loop... idk...
                        y = curQuad.endPoint.y;
                    } else {
                        y += inverseQuality;
                    }
                }
            }

            function GetQuad(plane, x, y) {
                var curQuadStart = new THREE.Vector3(x, y, 0);
                var baseBlock = getPlaneBlock(plane, curQuadStart);

                //Meh, the extra check may not be right, but its late...
                if(!baseBlock || Block.isEmpty(baseBlock)) return;

                var curQuadEnd = new THREE.Vector3(x + inverseQuality, y + inverseQuality, 0);

                /*
                //Try to extend on the y axis
                while(curQuadEnd.y < height) {
                    var curBlock = getPlaneBlock(plane, curQuadEnd);
                    if(curBlock != baseBlock) break;

                    curQuadEnd.y++;
                }

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
                        var canExtend = false;
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
                */

                return {
                    startPoint: curQuadStart, 
                    endPoint: curQuadEnd, 
                    blockType: baseBlock
                };
            }
        }

        var worldChunkOffset = new THREE.Vector3().multiplyVectors(chunkSize, curChunkPos);
        function convertBlockPosToWorldPos(blockPos) {
            blockPos.add(worldChunkOffset);
        }

        //Now turn the planeQuads into vertices, colors, and indexes
        for(var ix = 0; ix < planeQuads.length; ix++) {
            //quad is {startPoint, endPoint, blockType}

            var curQuad = planeQuads[ix];

            var blockPos = curQuad.startPoint.clone();
            //blockPos.setComponent(componentZ, curZ);
            //Offset normal axis based on block size.
            if(faceDirection == 1) {
                addToComponent(blockPos, componentZ, inverseQuality);
            }

            var quadWidth = curQuad.endPoint.x - curQuad.startPoint.x;
            var quadHeight = curQuad.endPoint.y - curQuad.startPoint.y;

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
            var faceIsClockwise = [false, true, false, false, true, true];

            var offsetArray = faceIsClockwise[faceNumber] ? clockwise : counterClockwise;

            offsetArray.forEach(function(offsets) {
                var verticePos = blockPos.clone();
                addToComponent(verticePos, componentX, quadWidth * offsets[0]);
                addToComponent(verticePos, componentY, quadHeight * offsets[1]);
                CallWithVector3(addVert, verticePos);
            });

            addFace(faceNumber, curQuad.blockType);
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
