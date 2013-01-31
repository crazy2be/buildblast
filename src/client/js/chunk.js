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
    
    function Chunk(world, blocks, cx, cy, cz) {
        var self = this;
        var isDisplayed = false;
        
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
            
            var px = world.blockAt(wx + 1, wy, wz);
            var nx = world.blockAt(wx - 1, wy, wz);
            var pz = world.blockAt(wx, wy, wz + 1);
            var nz = world.blockAt(wx, wy, wz - 1);
            var py = world.blockAt(wx, wy + 1, wz);
            var ny = world.blockAt(wx, wy - 1, wz);
            
            if (py && !py.isType(Block.DIRT)) {
                dummy.geometry = pyGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (px && px.isType(Block.AIR)) {
                dummy.geometry = pxGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (nx && nx.isType(Block.AIR)) {
                dummy.geometry = nxGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (pz && pz.isType(Block.AIR)) {
                dummy.geometry = pzGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }
            if (nz && nz.isType(Block.AIR)) {
                dummy.geometry = nzGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
            }    
        }
        
        self.isDisplayed = function () {
            return isDisplayed;
        }
        
        self.createGeometry = function () {
            isDisplayed = true;
            var geometry = new THREE.Geometry();
            var dummy = new THREE.Mesh();
            
            for (var ox = 0; ox < CHUNK_WIDTH; ox++) {
                for (var oy = 0; oy < CHUNK_HEIGHT; oy++) {
                    for (var oz = 0; oz < CHUNK_DEPTH; oz++) {
                        addBlockGeometry(geometry, dummy, ox, oy, oz);
                    }
                }
            }
            return geometry;
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

