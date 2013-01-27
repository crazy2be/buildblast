function World(scene) {
    var self = this;

    var perlin = new ImprovedNoise();
    function generateHeight(xs, zs, width, depth) {
        var data = [];
        var quality = 2;
        var y = Math.random() * 100;
        
        for (var x = xs; x < xs + width; x++) {
            for (var z = zs; z < zs + depth; z++) {
                data[x*width + z] = 0;
            }
        }
        
        for (var i = 0; i < 4; i++) {
            for (var x = xs; x < xs + width; x++) {
                for (var z = zs; z < zs + depth; z++) {
                    data[x*width + z] = perlin.noise(x / quality, z/quality, y) * quality;
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
        
        var data = generateHeight(x * 64, z * 64, 64, 64);
        var chunk = new Chunk(data, x * 64, z * 64);
        var geometry = chunk.createGeometry();
        addMesh(geometry);
        chunks[x + "," + z] = chunk;
        return chunk;
    }
    
    function addMesh(geometry) {
        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material1, material2]));
        scene.add(mesh);
    }
    
    function mod(a, b) {
        return ((a % b) + b) % b;
    }
    
    self.y = function (x, z) {
        var chunkX = Math.floor(x / 64);
        var chunkZ = Math.floor(z / 64);
        var localX = mod(x, 64) | 0;
        var localZ = mod(z, 64) | 0;
        console.log(x, z, chunkX, chunkZ);
        return chunkAt(chunkX, chunkZ).y(localX, localZ);
    }
}