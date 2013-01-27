var Chunk = (function () {
	var matrix = new THREE.Matrix4();
	
	var pxGeometry = new THREE.PlaneGeometry(1, 1);
	pxGeometry.faces[0].materialIndex = 1;
	pxGeometry.applyMatrix(matrix.makeRotationY(Math.PI / 2));
	pxGeometry.applyMatrix(matrix.makeTranslation(0.5, 0, 0));
	
	var nxGeometry = new THREE.PlaneGeometry(1, 1);
	nxGeometry.faces[0].materialIndex = 1;
	nxGeometry.applyMatrix(matrix.makeRotationY(-Math.PI/2));
	nxGeometry.applyMatrix(matrix.makeTranslation(-0.5, 0, 0));
	
	var pyGeometry = new THREE.PlaneGeometry(1, 1);
	pyGeometry.faces[0].materialIndex = 0;
	pyGeometry.applyMatrix(matrix.makeRotationX(-Math.PI/2));
	pyGeometry.applyMatrix(matrix.makeTranslation(0, 0.5, 0));
	
	var pzGeometry = new THREE.PlaneGeometry(1, 1);
	pzGeometry.faces[0].materialIndex = 1;
	pzGeometry.applyMatrix(matrix.makeTranslation(0, 0, 0.5));
	
	var nzGeometry = new THREE.PlaneGeometry(1, 1);
	nzGeometry.faces[0].materialIndex = 1;
	nzGeometry.applyMatrix(matrix.makeRotationY(Math.PI));
	nzGeometry.applyMatrix(matrix.makeTranslation(0, 0, -0.5));
	
	var CHUNK_WIDTH = 64;
	var CHUNK_DEPTH = 64;
	
	return Chunk;
	
	function Chunk(data, cx, cz) {
		var self = this;

		function getY(x, z) {
			return (data[x + z*CHUNK_WIDTH] * 0.2) | 0;
		}
		
		function addBlockGeometry(geometry, dummy, x, z) {
			var h = getY(x, z);
			
			dummy.position.x = x + cx;
			dummy.position.y = h;
			dummy.position.z = z + cz;
			
			var px = getY(x + 1, z);
			var nx = getY(x - 1, z);
			var pz = getY(x, z + 1);
			var nz = getY(x, z - 1);
			
			dummy.geometry = pyGeometry;
			THREE.GeometryUtils.merge(geometry, dummy);
			
			if ((px != h && px != h + 1) || x == 0) {
				dummy.geometry = pxGeometry;
				THREE.GeometryUtils.merge(geometry, dummy);
			}
			
			if ((nx != h && nx != h + 1) || x == CHUNK_WIDTH - 1) {
				dummy.geometry = nxGeometry;
				THREE.GeometryUtils.merge(geometry, dummy);
			}
			
			if ((pz != h && pz != h + 1) || z == CHUNK_DEPTH - 1) {
				dummy.geometry = pzGeometry;
				THREE.GeometryUtils.merge(geometry, dummy);
			}
			
			if ((nz != h && nz != h + 1) || z == 0) {
				dummy.geometry = nzGeometry;
				THREE.GeometryUtils.merge(geometry, dummy);
			}	
		}
		
		self.createGeometry = function () {
			var geometry = new THREE.Geometry();
			var dummy = new THREE.Mesh();
			
			for (var x = 0; x < CHUNK_WIDTH; x++) {
				for (var z = 0; z < CHUNK_DEPTH; z++) {
					addBlockGeometry(geometry, dummy, x, z);
				}
			}
			return geometry;
		}
		
		self.y = function (x, z) {
			return getY(x, z);
		}
	}
}());

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