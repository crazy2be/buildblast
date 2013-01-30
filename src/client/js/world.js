function World(scene) {
    var self = this;

    var seed = Math.random() * 100;
    var perlin = new ImprovedNoise();
    function generateHeightMap(xs, zs, width, depth) {
        var heightMap = [];
        var quality = 2;
        
        for (var x = 0; x < width; x++) {
            heightMap[x] = [];
            for (var z = 0; z < depth; z++) {
                heightMap[x][z] = 0;
            }
        }
        
        for (var i = 0; i < 4; i++) {
            for (var x = 0; x < width; x++) {
                for (var z = 0; z < depth; z++) {
                    var wx = xs + x;
                    var wz = zs + z;
                    heightMap[x][z] = perlin.noise(wx / quality, wz / quality, seed) * quality;
                }
            }
            quality *= 4;
        }
        
        for (var x = 0; x < width; x++) {
            for (var z = 0; z < depth; z++) {
                heightMap[x][z] *= 0.2;
            }
        }
        return heightMap;
    }
    
    function generateChunk(cx, cy, cz) {
        var heightMap = generateHeightMap(cx * CHUNK_WIDTH, cz * CHUNK_DEPTH, CHUNK_WIDTH, CHUNK_DEPTH);
        
        var blocks = [];
        for (var ox = 0; ox < CHUNK_WIDTH; ox++) {
            blocks[ox] = [];
            for (var oy = 0; oy < CHUNK_HEIGHT; oy++) {
                blocks[ox][oy] = [];
                for (var oz = 0; oz < CHUNK_DEPTH; oz++) {
                    if (heightMap[ox][oz] > oy + cy*CHUNK_HEIGHT) {
                        blocks[ox][oy][oz] = {type: 'dirt'};
                    } else {
                        blocks[ox][oy][oz] = {type: 'air'};
                    }
                }
            }
        }
        return new Chunk(blocks, cx, cy, cz);
    }
    
    var material0 = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
    });
    var material1 = new THREE.MeshBasicMaterial({
        color: 0xA52A2A
    });
    
    var chunks = {};
    function chunkAt(cx, cy, cz) {
        var existing = chunks[cx + ',' + cy + ',' + cz];
        if (existing) return existing;
        else return self.loadChunk(cx, cy, cz);
    }
    
    function mod(a, b) {
        return (((a % b) + b) % b) | 0;
    }
    
    self.loadChunk = function (cx, cy, cz) {
        var chunk = generateChunk(cx, cy, cz);
        var geometry = chunk.createGeometry();
        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material0, material1]));
        scene.add(mesh);
        chunks[cx + "," + cy + "," + cz] = chunk;
        return chunk;
    }
    
    self.findClosestGround = function (wx, wy, wz) {
        var cx = Math.floor(wx / CHUNK_WIDTH);
        var cy = Math.floor(wy / CHUNK_HEIGHT);
        var cz = Math.floor(wz / CHUNK_DEPTH);
        var ox = mod(wx, CHUNK_WIDTH);
        var oy = mod(wy, CHUNK_HEIGHT);
        var oz = mod(wz, CHUNK_DEPTH);
        
        var chunk = chunkAt(cx, cy, cz);
        if (chunk.blockAt(ox, oy, oz).type == 'air') {
            // Try and find ground below
            while (true) {
                if (oy-- < 0) {
                    oy = CHUNK_HEIGHT;
                    cy--;
                    chunk = chunkAt(cx, cy, cz);
                }
                if (chunk.blockAt(ox, oy, oz).type == 'dirt') {
                    return oy + cy * CHUNK_HEIGHT;
                }
            }
        } else if (chunk.blockAt(ox, oy, oz).type == 'dirt') {
            // Try and find air above
            while (true) {
                if (oy++ >= CHUNK_HEIGHT) {
                    oy = 0;
                    cy++;
                    chunk = chunkAt(cx, cy, cz);
                }
                if (chunk.blockAt(ox, oy, oz).type == 'air') {
                    return oy - 1 + cy * CHUNK_HEIGHT;
                }
            }
        } else {
            throw "findClosestGround only knows how to deal with ground and air blocks.";
        }
    }
}