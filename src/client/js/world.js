function Chunck() {
	
}

function World() {
    chunks = [];
	chunks[0] = [];
	chunks[0][0] = generateChunk(128, 128);
	chunks[0][1] = generateChunk(128, 128);

    function generateChunk(width, height) {
        var data = [];
        var perlin = new ImprovedNoise();
        var size = width * height;
        var quality = 2;
        var z = Math.random() * 100;
        
        for (var i = 0; i < size; i++) {
            data[i] = 0;
        }
        
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < size; j++) {
                var x = j % width
                var y = (j / width) | 0;
                
                data[j] += perlin.noise(x / quality, y / quality, z) * quality;
            }
            quality *= 4
        }
        return data;
    }
}