function World(scene) {
    var self = this;

    var seed = Math.random() * 100;
    
    var chunks = {};
    
    function chunkAt(cx, cy, cz) {
        var chunk = chunks[cx + ',' + cy + ',' + cz];
        return chunk;
    }
    
    function createChunk(cx, cy, cz) {
        var chunk = chunkAt(cx, cy, cz);
        if (!chunk) {
            chunk = Chunk.generateChunk(cx, cy, cz, self);
            chunks[cx + "," + cy + "," + cz] = chunk;
        }
        return chunk;
    }
    
    function displayChunk(cx, cy, cz) {
        var chunk = createChunk(cx, cy, cz);
        if (chunk.isDisplayed()) return chunk;
        chunk.addTo(scene);
        return chunk;
    }
    
    function mod(a, b) {
        return (((a % b) + b) % b);
    }
    
    self.getSeed = function () {
        return seed;
    }
    
    self.addSmallCube = function (position) {
        if (!position) throw "Position required!";
        var cube = new THREE.Mesh( new THREE.CubeGeometry(0.1, 0.1, 0.1), new THREE.MeshNormalMaterial() );
        cube.position = position;
        scene.add(cube);
    }
    
    self.loadChunk = function (cx, cy, cz) {
        displayChunk(cx, cy, cz);
    }
    
    self.hideChunk = function (cx, cy, cz) {
        var chunk = chunkAt(cx, cy, cz);
        chunk.removeFrom(scene);
    }
    
    self.blockAt = function (wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var cx = cords[0][0];
        var cy = cords[0][1];
        var cz = cords[0][2];
        var ox = cords[1][0];
        var oy = cords[1][1];
        var oz = cords[1][2];
        
        var chunk = createChunk(cx, cy, cz);
        var block = chunk.blockAt(ox, oy, oz);
        if (!block) throw "Could not load blockkk!!!";
        else return block;
    }
    
    self.findClosestGround = function (wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var cx = cords[0][0];
        var cy = cords[0][1];
        var cz = cords[0][2];
        var ox = cords[1][0];
        var oy = cords[1][1];
        var oz = cords[1][2];
        
        var chunk = displayChunk(cx, cy, cz);
        var block;
        if (chunk.blockAt(ox, oy, oz).isType(Block.AIR)) {
            // Try and find ground below
            while (true) {
                if (oy-- < 0) {
                    oy = CHUNK_HEIGHT;
                    cy--;
                    chunk = displayChunk(cx, cy, cz);
                }
                block = chunk.blockAt(ox, oy, oz);
                if (block && block.isType(Block.DIRT)) {
                    return oy + cy * CHUNK_HEIGHT;
                }
            }
        } else if (chunk.blockAt(ox, oy, oz).isType(Block.DIRT)) {
            // Try and find air above
            while (true) {
                if (oy++ >= CHUNK_HEIGHT) {
                    oy = 0;
                    cy++;
                    chunk = displayChunk(cx, cy, cz);
                }
                block = chunk.blockAt(ox, oy, oz);
                if (block && block.isType(Block.AIR)) {
                    return oy - 1 + cy * CHUNK_HEIGHT;
                }
            }
        } else {
            throw "findClosestGround only knows how to deal with ground and air blocks.";
        }
    }
    
    self.findWorldIntersection = function (camera) {
        var vector = new THREE.Vector3(0, 0, 0);
        var projector = new THREE.Projector();
        projector.unprojectVector(vector, camera);
        vector.sub(camera.position).normalize();
        
        var raycaster = new THREE.Raycaster(camera.position, vector);
        for (var key in chunks) {
            var chunk = chunks[key];
            var intersects = raycaster.intersectObject(chunk.getMesh());
            if (intersects.length > 0) {
                return intersects[0].point;
            }
        }
    }
    
    self.removeLookedAtBlock = function (camera) {
        var p = self.findWorldIntersection(camera);
        if (!p) return;
        
        var x = p.x;
        var y = p.y;
        var z = p.z;
        var b = function (x, y, z) {
            return self.blockAt(x, y, z);
        }
        
        if (onFace(x)) {
            if (b(x + 0.5, y, z).isType(Block.DIRT)) {
                removeBlock(x + 0.5, y, z);
            } else {
                removeBlock(x - 0.5, y, z);
            }
        } else if (onFace(y)) {
            if (b(x, y + 0.5, z).isType(Block.DIRT)) {
                removeBlock(x, y + 0.5, z);
            } else {
                removeBlock(x, y - 0.5, z);
            }
        } else if (onFace(z)) {
            if (b(x, y, z + 0.5).isType(Block.DIRT)) {
                removeBlock(x, y, z + 0.5);
            } else {
                removeBlock(x, y, z - 0.5);
            }
        } else {
            console.log("Could not find looked at block!");
        }
    }
    
    function onFace(n) {
        if (abs(n % 1) < 0.001 || abs(n % 1 - 1) < 0.001 || abs(n % 1 + 1) < 0.001) return true;
        else return false;
    }
    
    function abs(n) {
        return Math.abs(n);
    }
    
    function removeBlock(wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var cx = cords[0][0];
        var cy = cords[0][1];
        var cz = cords[0][2];
        var ox = cords[1][0];
        var oy = cords[1][1];
        var oz = cords[1][2];
        
        var chunk = chunkAt(cx, cy, cz);
        if (!chunk) throw "Cannot find chunk to remove from!";
        var block = chunk.blockAt(ox, oy, oz);
        if (!block) throw "Cannot find block within chunk!";
        block.setType(Block.AIR);
        
        // Invalidate chunks
        var changedChunks = [];
        changedChunks.push([cx, cy, cz]);
        // PosX
        cords = worldToChunk(wx + 1, wy, wz);
        if (!chunkInArray(changedChunks, cords[0])) {
            changedChunks.push(cords[0]);
        }
        // NegX
        cords = worldToChunk(wx - 1, wy, wz);
        if (!chunkInArray(changedChunks, cords[0])) {
            changedChunks.push(cords[0]);
        }
        // PosY
        cords = worldToChunk(wx, wy + 1, wz);
        if (!chunkInArray(changedChunks, cords[0])) {
            changedChunks.push(cords[0]);
        }
        // NegY
        cords = worldToChunk(wx, wy - 1, wz);
        if (!chunkInArray(changedChunks, cords[0])) {
            changedChunks.push(cords[0]);
        }
        // PosZ
        cords = worldToChunk(wx, wy, wz + 1);
        if (!chunkInArray(changedChunks, cords[0])) {
            changedChunks.push(cords[0]);
        }
        // NegZ
        cords = worldToChunk(wx, wy, wz - 1);
        if (!chunkInArray(changedChunks, cords[0])) {
            changedChunks.push(cords[0]);
        }
        
        for (var i = 0; i < changedChunks.length; i++) {
            cx = changedChunks[i][0];
            cy = changedChunks[i][1];
            cz = changedChunks[i][2];
            createChunk(cx, cy, cz).refresh(scene);
        }
    }
    
    function worldToChunk(wx, wy, wz) {
        return [[
                Math.floor(wx / CHUNK_WIDTH),
                Math.floor(wy / CHUNK_HEIGHT),
                Math.floor(wz / CHUNK_DEPTH)
            ],[
                Math.floor(mod(wx, CHUNK_WIDTH)),
                Math.floor(mod(wy, CHUNK_HEIGHT)),
                Math.floor(mod(wz, CHUNK_DEPTH))
            ]
        ];
    }
    
    function chunkInArray(array, coords) {
        outer:for (var i = 0; i < array.length; i++) {
            for (var j = 0; j < 3; j++) {
                if (array[i][j] !== coords[j]) {
                    continue outer;
                }
            }
            return true;
        }
        return false;
    }
}
