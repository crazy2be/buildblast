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

    var precision = 1;
    self.setPrecision = function (newPrecision) {
        precision = newPrecision;
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

        var blocksa = new Uint8Array(blocks.length);
        copy(blocks, blocksa);

        var attributes = {
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
        var offsets = [{
            start: 0,
            count: index.length,
            index: 0,
        }];
        return {
            attributes: attributes,
            offsets: offsets,
            blocks: blocksa,
            transferables: [vertsa.buffer, indexa.buffer, colora.buffer, blocksa.buffer],
        };
    }

    self.block = function block(ox, oy, oz) {
        if (validChunkOffset(ox, oy, oz)) {
            return blocks[ox*cw*ch + oy*cw + oz];
        }
        return null;
    };

    self.setBlock = function setBlock (ox, oy, oz, type) {
        if (validChunkOffset(ox, oy, oz)) {
            blocks[ox*cw*ch + oy*cw + oz] = type;
        } else {
            throw "Invalid offset coords!";
        }
    };

    function t(bl) {
        // Transparent
        return bl === 0x1;
    }

    function b(ox, oy, oz) {
        if (ox < 0) return nxc ? nxc.block(ox + cw, oy, oz) : null;
        if (ox >= cw) return pxc ? pxc.block(ox - cw, oy, oz) : null;
        if (oy < 0) return nyc ? nyc.block(ox, oy + ch, oz) : null;
        if (oy >= ch) return pyc ? pyc.block(ox, oy - ch, oz) : null;
        if (oz < 0) return nzc ? nzc.block(ox, oy, oz + cd) : null;
        if (oz >= cd) return pzc ? pzc.block(ox, oy, oz - cd) : null;
        return blocks[ox*cw*ch + oy*cw + oz];
    }

    function tb(ox, oy, oz) {
        var bl = b(ox, oy, oz);
        if (bl) return t(bl);
        else return false;
    }

    var noise = [];
    function addBlockGeometry(verts, index, color, ox, oy, oz) {
        if (tb(ox, oy, oz)) return;

        var px = tb(ox + 1, oy, oz);
        var nx = tb(ox - 1, oy, oz);
        var py = tb(ox, oy + 1, oz);
        var ny = tb(ox, oy - 1, oz);
        var pz = tb(ox, oy, oz + 1);
        var nz = tb(ox, oy, oz - 1);

        var wx = ox + cx*cw;
        var wy = oy + cy*ch;
        var wz = oz + cz*cd;

        if (px) {
            v(wx + 1, wy    , wz    );
            v(wx + 1, wy + 1, wz    );
            v(wx + 1, wy + 1, wz + 1);
            v(wx + 1, wy    , wz + 1);
            f(0);
        }
        if (nx) {
            v(wx, wy    , wz + 1);
            v(wx, wy + 1, wz + 1);
            v(wx, wy + 1, wz    );
            v(wx, wy    , wz    );
            f(1);
        }
        if (py) {
            v(wx    , wy + 1, wz + 1);
            v(wx + 1, wy + 1, wz + 1);
            v(wx + 1, wy + 1, wz    );
            v(wx    , wy + 1, wz    );
            f(2);
        }
        if (ny) {
            v(wx    , wy, wz    );
            v(wx + 1, wy, wz    );
            v(wx + 1, wy, wz + 1);
            v(wx    , wy, wz + 1);
            f(3);
        }
        if (pz) {
            v(wx    , wy    , wz + 1);
            v(wx + 1, wy    , wz + 1);
            v(wx + 1, wy + 1, wz + 1);
            v(wx    , wy + 1, wz + 1);
            f(4);
        }
        if (nz) {
            v(wx    , wy + 1, wz);
            v(wx + 1, wy + 1, wz);
            v(wx + 1, wy    , wz);
            v(wx    , wy    , wz);
            f(5);
        }
        return;

        function noiseFunc(x, y, z, q) {
            var val = 0;
            if (q === undefined) q = 2;
            if (q > 32) return 0;
            val += noiseFunc(x * q, y * q, z * q, q * 4) / q;
            x += x < 0 ? -0.1 : 0.1;
            y += y < 0 ? -0.1 : 0.1;
            z += z < 0 ? -0.1 : 0.1;
            val += perlinNoise(x, y, z);
            return Math.abs(val) * 2 + 0.2;
        }
        function v(x, y, z) {
            verts.push(x, y, z);
            noise.push(noiseFunc(x, y, z));
        }
        function f(mat, normal) {
            var l = verts.length / 3;
            // Each face is made up of two triangles
            index.push(l-4, l-3, l-2);
            index.push(l-4, l-2, l-1);

            // Dirt color from http://www.colourlovers.com/color/784800/dirt
            var c = [120/255, 72/255, 0];
            if (mat === 2) {
                c = [0, 1, 0];
            }

            var r = noise.shift();
            color.push(c[0]*r, c[1]*r, c[2]*r);
            r = noise.shift();
            color.push(c[0]*r, c[1]*r, c[2]*r);
            r = noise.shift();
            color.push(c[0]*r, c[1]*r, c[2]*r);
            r = noise.shift();
            color.push(c[0]*r, c[1]*r, c[2]*r);
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
}
