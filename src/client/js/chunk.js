var CHUNK_WIDTH = 32;
var CHUNK_DEPTH = 32;
var CHUNK_HEIGHT = 32;

var Chunk = (function () {
    var matrix = new THREE.Matrix4();
    
    var pxGeometry = new THREE.PlaneGeometry(1, 1);
    pxGeometry.faces[0].materialIndex = 0;
    pxGeometry.applyMatrix(matrix.makeRotationY(Math.PI / 2));
    pxGeometry.applyMatrix(matrix.makeTranslation(1, 0.5, 0.5));
    
    var nxGeometry = new THREE.PlaneGeometry(1, 1);
    nxGeometry.faces[0].materialIndex = 1;
    nxGeometry.applyMatrix(matrix.makeRotationY(-Math.PI / 2));
    nxGeometry.applyMatrix(matrix.makeTranslation(0, 0.5, 0.5));
    
    var pyGeometry = new THREE.PlaneGeometry(1, 1);
    pyGeometry.faces[0].materialIndex = 2;
    pyGeometry.applyMatrix(matrix.makeRotationX(-Math.PI / 2));
    pyGeometry.applyMatrix(matrix.makeTranslation(0.5, 1, 0.5));
    
    var nyGeometry = new THREE.PlaneGeometry(1, 1);
    nyGeometry.faces[0].materialIndex = 3;
    nyGeometry.applyMatrix(matrix.makeRotationX(Math.PI / 2));
    nyGeometry.applyMatrix(matrix.makeTranslation(0.5, 0, 0.5));
    
    var pzGeometry = new THREE.PlaneGeometry(1, 1);
    pzGeometry.faces[0].materialIndex = 4;
    pzGeometry.applyMatrix(matrix.makeTranslation(0.5, 0.5, 1));
    
    var nzGeometry = new THREE.PlaneGeometry(1, 1);
    nzGeometry.faces[0].materialIndex = 5;
    nzGeometry.applyMatrix(matrix.makeRotationY(Math.PI));
    nzGeometry.applyMatrix(matrix.makeTranslation(0.5, 0.5, 0));
    
    var materials = [
        new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        }),
        new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7
        }),
        new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0.7
        }),
        new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.7
        }),
        new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.7
        }),
        new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        })
    ];
    
    var wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true
    });
    
    return Chunk;
    
    function Chunk(world, blocks, cx, cy, cz) {
        var self = this;
        var isDisplayed = false;
        var mesh;
        var wireMesh;
        
        // Offset relative to chunk
        function block(ox, oy, oz) {
            if (blocks[ox] && blocks[ox][oy] && blocks[ox][oy][oz]) {
                return blocks[ox][oy][oz];
            }
            return null;
        }
        
        function addBlockGeometry(geometry, dummy, ox, oy, oz) {
            var wx = ox + cx*CHUNK_WIDTH;
            var wy = oy + cy*CHUNK_HEIGHT;
            var wz = oz + cz*CHUNK_DEPTH;
            dummy.position.x = wx;
            dummy.position.y = wy;
            dummy.position.z = wz;
            
            if (world.blockAt(wx, wy, wz).isType(Block.AIR)) return;
            
            var px = block(ox + 1, oy, oz);
            if (!px) px = world.blockAt(wx + 1, wy, wz);
            
            var nx = block(ox - 1, oy, oz);
            if (!nx) nx = world.blockAt(wx - 1, wy, wz);
            
            var pz = block(ox, oy, oz + 1);
            if (!pz) pz = world.blockAt(wx, wy, wz + 1);
            
            var nz = block(ox, oy, oz - 1);
            if (!nz) nz = world.blockAt(wx, wy, wz - 1);
            
            var py = block(ox, oy + 1, oz);
            if (!py) py = world.blockAt(wx, wy + 1, wz);
            
            var ny = block(ox, oy - 1, oz);
            if (!ny) ny = world.blockAt(wx, wy - 1, wz);
            
            if (py.isType(Block.AIR)) {
                dummy.geometry = pyGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (ny.isType(Block.AIR)) {
                dummy.geometry = nyGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (px.isType(Block.AIR)) {
                dummy.geometry = pxGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (nx.isType(Block.AIR)) {
                dummy.geometry = nxGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (pz.isType(Block.AIR)) {
                dummy.geometry = pzGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (nz.isType(Block.AIR)) {
                dummy.geometry = nzGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }    
        }
        
        self.isDisplayed = function () {
            return isDisplayed;
        }
        
        self.addTo = function (scene) {
            var geometry = new THREE.Geometry();
            var dummy = new THREE.Mesh();
            
            for (var ox = 0; ox < CHUNK_WIDTH; ox++) {
                for (var oy = 0; oy < CHUNK_HEIGHT; oy++) {
                    for (var oz = 0; oz < CHUNK_DEPTH; oz++) {
                        addBlockGeometry(geometry, dummy, ox, oy, oz);
                    }
                }
            }
            mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
            wireMesh = new THREE.Mesh(geometry, wireMaterial);
            scene.add(mesh);
            scene.add(wireMesh);
            isDisplayed = true;
            return self;
        }
        
        self.getMesh = function () {
            return mesh;
        }
        
        self.removeFrom = function (scene) {
            isDisplayed = false;
            if (!mesh) return;
            scene.remove(mesh);
            scene.remove(wireMesh);
        }

        self.refresh = function (scene) {
            self.removeFrom(scene);
            self.addTo(scene);
        }
        
        self.blockAt = function (ox, oy, oz) {
            return block(ox, oy, oz);
        }
    }
}());

Chunk.generateChunk = function(cx, cy, cz, world) {
    var heightMap = Generator.generateHeightMap(cx * CHUNK_WIDTH, cz * CHUNK_DEPTH, CHUNK_WIDTH, CHUNK_DEPTH, world.getSeed());

    var blocks = [];
    for (var ox = 0; ox < CHUNK_WIDTH; ox++) {
        blocks[ox] = [];
        for (var oy = 0; oy < CHUNK_HEIGHT; oy++) {
            blocks[ox][oy] = [];
            for (var oz = 0; oz < CHUNK_DEPTH; oz++) {
                if (heightMap[ox][oz] > oy + cy*CHUNK_HEIGHT) {
                    blocks[ox][oy][oz] = new Block(Block.DIRT);
                } else {
                    blocks[ox][oy][oz] = new Block(Block.AIR);
                }
            }
        }
    }
    return new Chunk(world, blocks, cx, cy, cz);
}

