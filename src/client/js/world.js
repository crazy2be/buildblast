function World(scene) {
    var self = this;

    var seed = Math.random() * 100;
    
    var material0 = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
    });
    var material1 = new THREE.MeshBasicMaterial({
        color: 0xA52A2A
    });
    
    var chunks = {};
    
    function chunkAt(cx, cy, cz, display) {
        var chunk = chunks[cx + ',' + cy + ',' + cz];
        if (!chunk) {
            chunk = Chunk.generateChunk(cx, cy, cz, self);
            chunks[cx + "," + cy + "," + cz] = chunk;
        }
        if (display) {
            displayChunk(chunk);
        }
        return chunk;
    }
    
    function displayChunk(chunk) {
        if (chunk.isDisplayed()) return;
        var geometry = chunk.createGeometry();
        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material0, material1]));
        scene.add(mesh);
    }
    
    function mod(a, b) {
        return (((a % b) + b) % b) | 0;
    }
    
    self.getSeed = function () {
        return seed;
    }
    
    self.loadChunk = function (cx, cy, cz) {
        var chunk = chunkAt(cx, cy, cz, true);
    }
    
    self.blockAt = function (wx, wy, wz) {
        var cx = Math.floor(wx / CHUNK_WIDTH);
        var cy = Math.floor(wy / CHUNK_HEIGHT);
        var cz = Math.floor(wz / CHUNK_DEPTH);
        var ox = mod(wx, CHUNK_WIDTH);
        var oy = mod(wy, CHUNK_HEIGHT);
        var oz = mod(wz, CHUNK_DEPTH);
        
        return chunkAt(cx, cy, cz, false).blockAt(ox, oy, oz);
    }
    
    self.findClosestGround = function (wx, wy, wz) {
        var cx = Math.floor(wx / CHUNK_WIDTH);
        var cy = Math.floor(wy / CHUNK_HEIGHT);
        var cz = Math.floor(wz / CHUNK_DEPTH);
        var ox = mod(wx, CHUNK_WIDTH);
        var oy = mod(wy, CHUNK_HEIGHT);
        var oz = mod(wz, CHUNK_DEPTH);
        
        var chunk = chunkAt(cx, cy, cz, true);
        var block;
        if (chunk.blockAt(ox, oy, oz).isType(Block.AIR)) {
            // Try and find ground below
            while (true) {
                if (oy-- < 0) {
                    oy = CHUNK_HEIGHT;
                    cy--;
                    chunk = chunkAt(cx, cy, cz, true);
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
                    chunk = chunkAt(cx, cy, cz, true);
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