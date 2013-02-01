function World(scene) {
    var self = this;

    var seed = Math.random() * 100;
    
    var chunks = {};
    
    function chunkAt(cx, cy, cz) {
        var chunk = chunks[cx + ',' + cy + ',' + cz];
        return chunk;
    }
    
    function loadChunk(cx, cy, cz) {
        var chunk = chunkAt(cx, cy, cz);
        if (!chunk) {
            chunk = Chunk.generateChunk(cx, cy, cz, self);
            chunks[cx + "," + cy + "," + cz] = chunk;
        }
        return chunk;
    }
    
    function displayChunk(cx, cy, cz) {
        var chunk = loadChunk(cx, cy, cz);
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
        var cx = Math.floor(wx / CHUNK_WIDTH);
        var cy = Math.floor(wy / CHUNK_HEIGHT);
        var cz = Math.floor(wz / CHUNK_DEPTH);
        var ox = mod(wx, CHUNK_WIDTH) | 0;
        var oy = mod(wy, CHUNK_HEIGHT) | 0;
        var oz = mod(wz, CHUNK_DEPTH) | 0;
        
        var chunk = loadChunk(cx, cy, cz);
        var block = chunk.blockAt(ox, oy, oz);
        if (!block) throw "Could not load blockkk!!!";
        else return block;
    }
    
    self.findClosestGround = function (wx, wy, wz) {
        var cx = Math.floor(wx / CHUNK_WIDTH);
        var cy = Math.floor(wy / CHUNK_HEIGHT);
        var cz = Math.floor(wz / CHUNK_DEPTH);
        var ox = mod(wx, CHUNK_WIDTH) | 0;
        var oy = mod(wy, CHUNK_HEIGHT) | 0;
        var oz = mod(wz, CHUNK_DEPTH) | 0;
        
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
        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
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
        
        if (abs(x % 0.5) < 0.001) {
            if (b(x + 0.5, y, z).isType(Block.DIRT)) {
                removeBlock(x + 0.5, y, z);
            } else {
                removeBlock(x - 0.5, y, z);
            }
        } else if (abs(y % 0.5) < 0.001) {
            if (b(x, y + 0.5, z).isType(Block.DIRT)) {
                removeBlock(x, y + 0.5, z);
            } else {
                removeBlock(x, y - 0.5, z);
            }
        } else {
            if (b(x, y, z + 0.5).isType(Block.DIRT)) {
                removeBlock(x, y, z + 0.5);
            } else {
                removeBlock(x, y, z - 0.5);
            }
        }
        console.log(p);
    }
    
    function abs(n) {
        return Math.abs(n);
    }
    
    function removeBlock(wx, wy, wz) {
        var cx = Math.floor(wx / CHUNK_WIDTH);
        var cy = Math.floor(wy / CHUNK_HEIGHT);
        var cz = Math.floor(wz / CHUNK_DEPTH);
        var ox = mod(wx, CHUNK_WIDTH) + 0.5 | 0;
        var oy = mod(wy, CHUNK_HEIGHT) + 0.5 | 0;
        var oz = mod(wz, CHUNK_DEPTH) + 0.5 | 0;
        
        console.log("Would remove block at ", wx, wy, wz, cx, cy, cz, ox, oy, oz);
        var chunk = chunkAt(cx, cy, cz);
        if (!chunk) throw "Cannot find chunk to remove from!";
        var block = chunk.blockAt(ox, oy, oz);
        if (!block) throw "Cannot find block within chunk!";
        block.setType(Block.AIR);
        
        chunk.removeFrom(scene);
        chunk.addTo(scene);
    }
}