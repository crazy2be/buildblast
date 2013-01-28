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
    function chunkAt(x, z) {
        var existing = chunks[x + ',' + z];
        if (existing) return existing;
        else return self.loadChunk(x, z);
    }
    
    function mod(a, b) {
        return ((a % b) + b) % b;
    }
    
    self.loadChunk = function (x, z) {
        var data = generateHeight(x * 64, z * 64, 64, 64);
        var chunk = new Chunk(data, x * 64, z * 64);
        var geometry = chunk.createGeometry();
        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material1, material2]));
        scene.add(mesh);
        chunks[x + "," + z] = chunk;
        return chunk;
    }
    
    self.y = function (x, z) {
        var chunkX = Math.floor(x / 64);
        var chunkZ = Math.floor(z / 64);
        var localX = mod(x, 64) | 0;
        var localZ = mod(z, 64) | 0;
        return chunkAt(chunkX, chunkZ).y(localX, localZ);
    }
}