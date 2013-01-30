var CHUNK_WIDTH = 32;
var CHUNK_DEPTH = 32;
var CHUNK_HEIGHT = 32;

var Chunk = (function () {
    var matrix = new THREE.Matrix4();
    
    var pxGeometry = new THREE.PlaneGeometry(1, 1);
    pxGeometry.faces[0].materialIndex = 1;
    pxGeometry.applyMatrix(matrix.makeRotationY(Math.PI / 2));
    pxGeometry.applyMatrix(matrix.makeTranslation(0.5, 0, 0));
    
    var nxGeometry = new THREE.PlaneGeometry(1, 1);
    nxGeometry.faces[0].materialIndex = 1;
    nxGeometry.applyMatrix(matrix.makeRotationY(-Math.PI / 2));
    nxGeometry.applyMatrix(matrix.makeTranslation(-0.5, 0, 0));
    
    var pyGeometry = new THREE.PlaneGeometry(1, 1);
    pyGeometry.faces[0].materialIndex = 0;
    pyGeometry.applyMatrix(matrix.makeRotationX(-Math.PI / 2));
    pyGeometry.applyMatrix(matrix.makeTranslation(0, 0.5, 0));
    
    var pzGeometry = new THREE.PlaneGeometry(1, 1);
    pzGeometry.faces[0].materialIndex = 1;
    pzGeometry.applyMatrix(matrix.makeTranslation(0, 0, 0.5));
    
    var nzGeometry = new THREE.PlaneGeometry(1, 1);
    nzGeometry.faces[0].materialIndex = 1;
    nzGeometry.applyMatrix(matrix.makeRotationY(Math.PI));
    nzGeometry.applyMatrix(matrix.makeTranslation(0, 0, -0.5));
    
    return Chunk;
    
    function Chunk(blocks, cx, cy, cz) {
        var self = this;
        
        // Offset relative to chunk
        function block(ox, oy, oz) {
            if (blocks[ox] && blocks[ox][oy] && blocks[ox][oy][oz]) {
                return blocks[ox][oy][oz];
            } else {
                return {};
            }
        }
        
        function addBlockGeometry(geometry, dummy, x, y, z) {
            dummy.position.x = x + cx*CHUNK_WIDTH;
            dummy.position.y = y + cy*CHUNK_HEIGHT;
            dummy.position.z = z + cz*CHUNK_DEPTH;
            
            if (block(x, y, z).type == 'air') return;
            
            var px = block(x + 1, y, z);
            var nx = block(x - 1, y, z);
            var pz = block(x, y, z + 1);
            var nz = block(x, y, z - 1);
            var py = block(x, y + 1, z);
            var ny = block(x, y - 1, z);
            
            if (py.type != 'dirt') {
                dummy.geometry = pyGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (px.type == 'air') {
                dummy.geometry = pxGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (nx.type == 'air') {
                dummy.geometry = nxGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (pz.type == 'air') {
                dummy.geometry = pzGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (nz.type == 'air') {
                dummy.geometry = nzGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }    
        }
        
        self.createGeometry = function () {
            var geometry = new THREE.Geometry();
            var dummy = new THREE.Mesh();
            
            for (var x = 0; x < CHUNK_WIDTH; x++) {
                for (var y = 0; y < CHUNK_HEIGHT; y++) {
                    for (var z = 0; z < CHUNK_DEPTH; z++) {
                        addBlockGeometry(geometry, dummy, x, y, z);
                    }
                }
            }
            return geometry;
        }
        
        self.y = function (x, z) {
            for (var y = 0; y < CHUNK_HEIGHT; y++) {
                if (block(x, y, z).type == 'air') {
                    return y + 1;
                }
            }
        }
    }
}());