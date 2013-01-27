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
	
	function Chunk(data) {
		var cx = -CHUNK_DEPTH / 2;
		var cz = -CHUNK_WIDTH / 2;
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

function World(data) {
	var self = this;
	var chunk = new Chunk(data);
	var geometry = chunk.createGeometry();
		
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
	
	self.generateMesh = function () {
		var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material1, material2]));
		return mesh;
	}
	
	self.y = function (x, z) {
		return chunk.y(x, z);
	}
}