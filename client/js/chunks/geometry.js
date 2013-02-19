function ChunkGeometry(cc, blocks, manager) {
    var self = this;

    self.blocks = blocks;
    self.cc = cc;
    self.priority = 1;
    self.shown = true;
    self.changed = true;
    self.loaded = false;

    var cw = CHUNK_WIDTH;
    var cd = CHUNK_DEPTH;
    var ch = CHUNK_HEIGHT;

    var cx = cc.x;
    var cy = cc.y;
    var cz = cc.z;

    // Neighbouring chunks
    var nxc, pxc, nyc, pyc, nzc, pzc;

    // Face normals;
    var nxn, pxn, nyn, pyn, nzn, pzn;

    function block(ox, oy, oz) {
        if (ox >= 0 && ox < cw &&
            oy >= 0 && oy < ch &&
            oz >= 0 && oz < cd) {
                return blocks[ox*cw*ch + oy*cw + oz];
        }
        return null;
    }

    function t(b) {
        // Transparent
        return b === 0x1;
    }

    function addBlockGeometry(verts, index, color, ox, oy, oz) {
        if (t(block(ox, oy, oz))) return;

        var pxb = block(ox + 1, oy, oz), px;
        if (pxb) px = t(pxb);
        else if (pxc) px = t(pxc.blockAt(0, oy, oz));
        else px = false;

        var nxb = block(ox - 1, oy, oz), nx;
        if (nxb) nx = t(nxb);
        else if (nxc) nx = t(nxc.blockAt(cw - 1, oy, oz));
        else nx = false;

        var pyb = block(ox, oy + 1, oz), py;
        if (pyb) py = t(pyb);
        else if (pyc) py = t(pyc.blockAt(ox, 0, oz));
        else py = false;

        var nyb = block(ox, oy - 1, oz), ny;
        if (nyb) ny = t(nyb);
        else if (nyc) ny = t(nyc.blockAt(ox, ch - 1, oz));
        else ny = false;

        var pzb = block(ox, oy, oz + 1), pz;
        if (pzb) pz = t(pzb);
        else if (pzc) pz = t(pzc.blockAt(ox, oy, 0));
        else ny = false;

        var nzb = block(ox, oy, oz - 1), nz;
        if (nzb) nz = t(nzb);
        else if (nzc) nz = t(nzc.blockAt(ox, oy, cd - 1));
        else nz = false;

        var wx = ox + cx*cw;
        var wy = oy + cy*ch;
        var wz = oz + cz*cd;

        function v(x, y, z) {
            verts.push(x, y, z);
        }

        function f(mat, normal) {
            var l = verts.length / 3;
            // Each face is made up of two triangles
            index.push(l-4, l-3, l-2);
            index.push(l-4, l-2, l-1);

            var r = Math.random();
            // Random colors make the world have depth.
            var c = [0.5*r, 0.5*r, 0.5*r];
            if (mat === 2) {
                c = [0, 1*r, 0];
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

    function updateNeighbours() {
        pxc = manager.chunkAt(cx + 1, cy, cz);
        nxc = manager.chunkAt(cx - 1, cy, cz);
        pyc = manager.chunkAt(cx, cy + 1, cz);
        nyc = manager.chunkAt(cx, cy - 1, cz);
        pzc = manager.chunkAt(cx, cy, cz + 1);
        nzc = manager.chunkAt(cx, cy, cz - 1);
    }

    self.calculateGeometry = function () {
        var verts = [];
        var index = [];
        var color = [];

        updateNeighbours();

        for (var ox = 0; ox < cw; ox++) {
            for (var oy = 0; oy < ch; oy++) {
                for (var oz = 0; oz < cd; oz++) {
                    addBlockGeometry(verts, index, color, ox, oy, oz);
                }
            }
        }

        function copy(src, dst) {
            for (var i = 0; i < src.length; i++) {
                dst[i] = src[i];
            }
        }

        var vertsa = new Float32Array(verts.length);
        copy(verts, vertsa);

        var indexa = new Uint16Array(index.length);
        copy(index, indexa);

        var colora = new Float32Array(color.length);
        copy(color, colora);

        var geometry = {};
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
        return {
            obj: geometry,
            transferables: [vertsa.buffer, indexa.buffer, colora.buffer],
        };
    }

    self.blockAt = function (ox, oy, oz) {
        return block(ox, oy, oz);
    }
}
