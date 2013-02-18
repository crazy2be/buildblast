var CHUNK_WIDTH = 16;
var CHUNK_DEPTH = 16;
var CHUNK_HEIGHT = 16;

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

    function Chunk(manager, blocks, cx, cy, cz) {
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

        function t(b) {
            return Block.transparent(b);
        }

        function addBlockGeometry(verts, index, color, ox, oy, oz) {
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

            var wx = ox + cx*cw;
            var wy = oy + cy*ch;
            var wz = oz + cz*cd;

            function v(x, y, z) {
                var vert = new THREE.Vector3(x, y, z);
                verts.push(vert);
            }
            function f(mat, normal) {
                var l = verts.length;
                index.push(l-4, l-3, l-2);
                index.push(l-4, l-2, l-1);
                // rgba for each vertex
                var c = [0.5, 0.5, 0.5];
                if (mat === 2) {
                    c = [0, 1, 0];
                }
                color.push(c[0], c[1], c[2]);
                color.push(c[0], c[1], c[2]);
                color.push(c[0], c[1], c[2]);
                color.push(c[0], c[1], c[2]);
            }
            if (px) {
                v(wx + 1, wy    , wz    );
                v(wx + 1, wy + 1, wz    );
                v(wx + 1, wy + 1, wz + 1);
                v(wx + 1, wy    , wz + 1);
                f(0, pxn);
            }
            if (nx) {
                v(wx, wy    , wz + 1);
                v(wx, wy + 1, wz + 1);
                v(wx, wy + 1, wz    );
                v(wx, wy    , wz    );
                f(1, nxn);
            }
            if (py) {
                v(wx    , wy + 1, wz + 1);
                v(wx + 1, wy + 1, wz + 1);
                v(wx + 1, wy + 1, wz    );
                v(wx    , wy + 1, wz    );
                f(2, pyn);
            }
            if (ny) {
                v(wx    , wy, wz    );
                v(wx + 1, wy, wz    );
                v(wx + 1, wy, wz + 1);
                v(wx    , wy, wz + 1);
                f(3, nyn);
            }
            if (pz) {
                v(wx    , wy    , wz + 1);
                v(wx + 1, wy    , wz + 1);
                v(wx + 1, wy + 1, wz + 1);
                v(wx    , wy + 1, wz + 1);
                f(4, pzn);
            }
            if (nz) {
                v(wx    , wy + 1, wz);
                v(wx + 1, wy + 1, wz);
                v(wx + 1, wy    , wz);
                v(wx    , wy    , wz);
                f(5, nzn);
            }
        }

        self.refreshNeighbours = function () {
            pxc = manager.chunkAt(cx + 1, cy, cz);
            nxc = manager.chunkAt(cx - 1, cy, cz);
            pyc = manager.chunkAt(cx, cy + 1, cz);
            nyc = manager.chunkAt(cx, cy - 1, cz);
            pzc = manager.chunkAt(cx, cy, cz + 1);
            nzc = manager.chunkAt(cx, cy, cz - 1);
        }

        self.addTo = function (scene) {
            if (isDisplayed) return;

            var geometry = new THREE.BufferGeometry();
            var verts = [];
            var index = [];
            var color = [];

            self.refreshNeighbours();

            for (var ox = 0; ox < cw; ox++) {
                for (var oy = 0; oy < ch; oy++) {
                    for (var oz = 0; oz < cd; oz++) {
                        addBlockGeometry(verts, index, color, ox, oy, oz);
                    }
                }
            }

            var vertsa = new Float32Array(verts.length*3);
            for (var i = 0; i < verts.length; i++) {
                var v = verts[i];
                vertsa[i*3]     = v.x;
                vertsa[i*3 + 1] = v.y;
                vertsa[i*3 + 2] = v.z;
            }

            var indexa = new Uint16Array(index.length);
            for (var i = 0; i < index.length; i++) {
                indexa[i] = index[i];
            }

            var colora = new Float32Array(color.length);
            for (var i = 0; i < color.length; i++) {
                colora[i] = color[i];
            }
            geometry.attributes = {
                position: {
                    itemSize: 3,
                    array: vertsa,
                    numItems: verts.length * 3,
                },
                index: {
                    itemSize: 1,
                    array: indexa,
                    numItems: index.length,
                },
                color: {
                    itemSize: 3,
                    array: colora,
                    numItems: color.length,
                },
            };
            geometry.offsets = [{
                start: 0,
                count: index.length,
                index: 0,
            }];

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

        // Remove chunk from world before calling
        // Destroys all object chains where other chunks
        // are referencing this chunk which cause
        // really long GC cycles as the GC tries to
        // trace the long object chains.
        self.unload = function () {
            self.refreshNeighbours();
            if (pxc) pxc.refreshNeighbours();
            if (nxc) nxc.refreshNeighbours();
            if (pyc) pyc.refreshNeighbours();
            if (nyc) nyc.refreshNeighbours();
            if (pzc) pzc.refreshNeighbours();
            if (nzc) nzc.refreshNeighbours();
            pxc = nxc = pyc = nyc = nzc = pzc = null;
        }

        self.refresh = function (scene) {
            self.removeFrom(scene);
            self.addTo(scene);
        }

        // Raw blockAt
        self.rblockAt = function (ox, oy, oz) {
            return block(ox, oy, oz);
        }

        self.blockAt = function (ox, oy, oz) {
            var b = block(ox, oy, oz);
            return b ? new Block(b) : null;
        }

        self.setBlock = setBlock;

        self.hide = function () {
            mesh.visible = false;
        }

        self.show = function () {
            mesh.visible = true;
        }
    }
}());
