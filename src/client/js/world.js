function World(scene) {
    var self = this;

    var seed = Math.random() * 100;
    var perlin = new ImprovedNoise();
    function generateHeight(xs, zs, width, depth) {
        var data = [];
        var quality = 2;
        
        for (var x = 0; x < width; x++) {
            for (var z = 0; z < depth; z++) {
                data[x * width + z] = 0;
            }
        }
        
        for (var i = 0; i < 4; i++) {
            for (var x = 0; x < width; x++) {
                for (var z = 0; z < depth; z++) {
                    var xTemp = xs + (x * width + z) % width;
                    var zTemp = zs + ((x * width + z) / width ) | 0;
                    data[x * width + z] = perlin.noise(xTemp / quality, zTemp / quality, seed) * quality;
                }
            }
            quality *= 4;
        }
        return data;
    }
    
    function generateChunk(cx, cy, cz) {
        var data = generateHeight(cx * CHUNK_WIDTH, cz * CHUNK_DEPTH, CHUNK_WIDTH, CHUNK_DEPTH);
        var blocks = [];
        for (var x = 0; x < CHUNK_WIDTH; x++) {
            blocks[x] = [];
            for (var y = 0; y < CHUNK_HEIGHT; y++) {
                blocks[x][y] = [];
                for (var z = 0; z < CHUNK_HEIGHT; z++) {
                    if (data[x + z * CHUNK_WIDTH] * 0.2 > y + cy*CHUNK_HEIGHT) {
                        blocks[x][y][z] = {type: 'dirt'};
                    } else {
                        blocks[x][y][z] = {type: 'air'};
                    }
                }
            }
        }
        return new Chunk(blocks, cx, cy, cz);
    }
    
    var textureGrass = THREE.ImageUtils.loadTexture('img/minecraft/grass.png');
    textureGrass.magFilter = THREE.NearestFilter;
    textureGrass.minFilter = THREE.LinearMipMapLinearFilter;
    
    var textureGrassDirt = THREE.ImageUtils.loadTexture('img/minecraft/grass_dirt.png');
    textureGrassDirt.magFilter = THREE.NearestFilter;
    textureGrassDirt.minFilter = THREE.LinearMipMapLinearFilter;
    
    var material1 = new THREE.MeshLambertMaterial({
        map: textureGrass,
        ambient: 0xbbbbbb
    });
    var material2 = new THREE.MeshLambertMaterial({
        map: textureGrassDirt,
        ambient: 0xbbbbbb
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
        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material1, material2]));
        scene.add(mesh);
        chunks[cx + "," + cy + "," + cz] = chunk;
        return chunk;
    }
    
    self.y = function (x, y, z) {
        var cx = Math.floor(x / CHUNK_WIDTH);
        var cy = Math.floor(y / CHUNK_HEIGHT);
        var cz = Math.floor(z / CHUNK_DEPTH);
        var ox = mod(x, CHUNK_WIDTH);
        var oz = mod(z, CHUNK_DEPTH);
        return chunkAt(cx, cy, cz).y(ox, oz);
    }
}