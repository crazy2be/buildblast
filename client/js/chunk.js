var CHUNK_WIDTH = 32;
var CHUNK_DEPTH = 32;
var CHUNK_HEIGHT = 32;

var Chunk = (function () {
    var cw = CHUNK_WIDTH;
    var ch = CHUNK_HEIGHT;
    var cd = CHUNK_DEPTH;

    // Face normals
    var nxn = new THREE.Vector3(-1, 0, 0);
    var pxn = new THREE.Vector3(1, 0, 0);
    var nyn = new THREE.Vector3(0, -1, 0);
    var pyn = new THREE.Vector3(0, 1, 0);
    var nzn = new THREE.Vector3(0, 0, -1);
    var pzn = new THREE.Vector3(0, 0, 1);

    return Chunk;

    function Chunk(blocks, geometry, cx, cy, cz) {
        var self = this;
        var isDisplayed = false;
        var mesh;

        function block(ox, oy, oz) {
            if (ox >= 0 && ox < cw &&
                oy >= 0 && oy < ch &&
                oz >= 0 && oz < cd) {
                    return blocks[ox*cw*ch + oy*cw + oz];
            }
            return null;
        }

        function setBlock(ox, oy, oz, t) {
            if (ox >= 0 && ox < cw &&
                oy >= 0 && oy < ch &&
                oz >= 0 && oz < cd) {
                    blocks[ox*cw*ch + oy*cw + oz] = t;
            } else {
                throw "setBlock coords out of bounds: " + ox + oy + oz;
            }
        }

        self.addTo = function (scene) {
            if (isDisplayed) return;

            mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                vertexColors: THREE.VertexColors
            }));
            scene.add(mesh);

            isDisplayed = true;

            return self;
        }

        self.getMesh = function () {
            return mesh;
        }

        self.removeFrom = function (scene) {
            if (!mesh) return;
            scene.remove(mesh);

            isDisplayed = false;

            return self;
        }

        self.unload = function () {}

        self.blockAt = function (ox, oy, oz) {
            var b = block(ox, oy, oz);
            return b ? new Block(b) : null;
        }

        self.setBlock = setBlock;

        self.hide = function () {
//             mesh.visible = false;
        }

        self.show = function () {
//             mesh.visible = true;
        }
    }
}());
