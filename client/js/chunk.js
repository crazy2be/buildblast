var CHUNK_WIDTH = 16;
var CHUNK_DEPTH = 16;
var CHUNK_HEIGHT = 16;

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

        var cw = CHUNK_WIDTH;
        var ch = CHUNK_HEIGHT;
        var cd = CHUNK_DEPTH;
        // Offset relative to chunk
        function block(ox, oy, oz) {
            if (ox >= 0 && ox < cw &&
                oy >= 0 && oy < ch &&
                oz >= 0 && oz < cd) {
                return blocks[ox*cw*ch + oy*cw + oz];
            }
            return null;
        }

        function t(b) {
            return Block.transparent(b);
        }

        function addBlockGeometry(geometry, dummy, ox, oy, oz) {
            var wx = ox + cx*cw;
            var wy = oy + cy*ch;
            var wz = oz + cz*cd;
            dummy.position.x = wx;
            dummy.position.y = wy;
            dummy.position.z = wz;

            if (t(block(ox, oy, oz))) return;

            var pxb = block(ox + 1, oy, oz), px;
            if (pxb) px = t(pxb);
            else if (pxc) px = t(pxc.rblockAt(0, oy, oz));
            else px = false;

            var nxb = block(ox - 1, oy, oz), nx;
            if (nxb) nx = t(nxb);
            else if (nxc) nx = t(nxc.rblockAt(cw - 1, oy, oz));
            else nx = false;

            var pyb = block(ox, oy + 1, oz), py;
            if (pyb) py = t(pyb);
            else if (pyc) py = t(pyc.rblockAt(ox, 0, oz));
            else py = false;

            var nyb = block(ox, oy - 1, oz), ny;
            if (nyb) ny = t(nyb);
            else if (nyc) ny = t(nyc.rblockAt(ox, ch - 1, oz));
            else ny = false;

            var pzb = block(ox, oy, oz + 1), pz;
            if (pzb) pz = t(pzb);
            else if (pzc) pz = t(pzc.rblockAt(ox, oy, 0));
            else ny = false;

            var nzb = block(ox, oy, oz - 1), nz;
            if (nzb) nz = t(nzb);
            else if (nzc) nz = t(nzc.rblockAt(ox, oy, cd - 1));
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

            for (var ox = 0; ox < cw; ox++) {
                for (var oy = 0; oy < ch; oy++) {
                    for (var oz = 0; oz < cd; oz++) {
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

        self.rblockAt = function (ox, oy, oz) {
            return block(ox, oy, oz);
        }
        self.blockAt = function (ox, oy, oz) {
            var b = block(ox, oy, oz);
            return b ? new Block(b) : null;
        }
    }
}());
