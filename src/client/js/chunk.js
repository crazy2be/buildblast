var CHUNK_WIDTH = 8;
var CHUNK_DEPTH = 8;
var CHUNK_HEIGHT = 8;

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
        
        var nxc;
        var pxc;
        var nyc;
        var pyc;
        var nzc;
        var pzc;
        
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
            
            if (blocks[ox][oy][oz].isType(Block.AIR)) return;
            
            var pxb = block(ox + 1, oy, oz), px;
            if (pxb) px = pxb.isTrans();
            else if (pxc) px = pxc.blockAt(0, oy, oz).isTrans();
            else px = false;
            
            var nxb = block(ox - 1, oy, oz), nx;
            if (nxb) nx = nxb.isTrans();
            else if (nxc) nx = nxc.blockAt(CHUNK_WIDTH - 1, oy, oz).isTrans();
            else nx = false;
            
            var pyb = block(ox, oy + 1, oz), py;
            if (pyb) py = pyb.isTrans();
            else if (pyc) py = pyc.blockAt(ox, 0, oz).isTrans();
            else py = false;
            
            var nyb = block(ox, oy - 1, oz), ny;
            if (nyb) ny = nyb.isTrans();
            else if (nyc) ny = nyc.blockAt(ox, CHUNK_HEIGHT - 1, oz).isTrans();
            else ny = false;
            
            var pzb = block(ox, oy, oz + 1), pz;
            if (pzb) pz = pzb.isTrans();
            else if (pzc) pz = pzc.blockAt(ox, oy, 0).isTrans();
            else ny = false;
            
            var nzb = block(ox, oy, oz - 1), nz;
            if (nzb) nz = nzb.isTrans();
            else if (nzc) nz = nzc.blockAt(ox, oy, CHUNK_DEPTH - 1).isTrans();
            else nz = false;
            
            if (px) {
                dummy.geometry = pxGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (nx) {
                dummy.geometry = nxGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (py) {
                dummy.geometry = pyGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (ny) {
                dummy.geometry = nyGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (pz) {
                dummy.geometry = pzGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (nz) {
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
            
            pxc = world.chunkAt(cx + 1, cy, cz);
            nxc = world.chunkAt(cx - 1, cy, cz);
            pyc = world.chunkAt(cx, cy + 1, cz);
            nyc = world.chunkAt(cx, cy - 1, cz);
            pzc = world.chunkAt(cx, cy, cz + 1);
            nzc = world.chunkAt(cx, cy, cz - 1);
            
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