Generator = (function() {
    var perlin = new ImprovedNoise();

    return {
        generateHeightMap : function(xs, zs, width, depth, seed) {
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
    }
}());
