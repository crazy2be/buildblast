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
        var mesh = chunk.createMesh();
        scene.add(mesh);
        return chunk;
    }
    
    function mod(a, b) {
        return (((a % b) + b) % b) | 0;
    }
    
    self.getSeed = function () {
        return seed;
    }
    
    self.getChunks = function () {
        return chunks;
    }
    
    self.addItem = function (position) {
        var cube = new THREE.Mesh( new THREE.CubeGeometry(0.1, 0.1, 0.1), new THREE.MeshNormalMaterial() );
        cube.position = position;
        scene.add(cube);
    }
    
    self.loadChunk = function (cx, cy, cz) {
        displayChunk(cx, cy, cz);
    }
    
    self.hideChunk = function (cx, cy, cz) {
        var chunk = chunkAt(cx, cy, cz);
        chunk.remove(scene);
    }
    
    self.blockAt = function (wx, wy, wz) {
        var cx = Math.floor(wx / CHUNK_WIDTH);
        var cy = Math.floor(wy / CHUNK_HEIGHT);
        var cz = Math.floor(wz / CHUNK_DEPTH);
        var ox = mod(wx, CHUNK_WIDTH);
        var oy = mod(wy, CHUNK_HEIGHT);
        var oz = mod(wz, CHUNK_DEPTH);
        
        var chunk = loadChunk(cx, cy, cz);
        return chunk.blockAt(ox, oy, oz);
    }
    
    self.findClosestGround = function (wx, wy, wz) {
        var cx = Math.floor(wx / CHUNK_WIDTH);
        var cy = Math.floor(wy / CHUNK_HEIGHT);
        var cz = Math.floor(wz / CHUNK_DEPTH);
        var ox = mod(wx, CHUNK_WIDTH);
        var oy = mod(wy, CHUNK_HEIGHT);
        var oz = mod(wz, CHUNK_DEPTH);
        
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
}