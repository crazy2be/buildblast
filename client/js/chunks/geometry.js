function ChunkGeometry(cc, blocks, manager) {
    var self = this;

    self.blocks = blocks;
    self.cc = cc;
    self.priority = 1;
    self.shown = true;
    self.changed = true;
    self.loaded = false;
    self.quality = 1;

    var cw = CHUNK_WIDTH;
    var cd = CHUNK_DEPTH;
    var ch = CHUNK_HEIGHT;

    var cx = cc.x;
    var cy = cc.y;
    var cz = cc.z;

    // Neighbouring chunks
    var nxc, pxc, nyc, pyc, nzc, pzc;

    self.calculateGeometries = function () {
        var geometries = [];
        var transferables = [];
        CHUNK_QUALITIES.forEach(function (quality) {
            var res = calculateGeometry(quality);
            geometries.push({
                attributes: res.attributes,
                offsets: res.offsets,
            });
            transferables.concat(res.transferables);
        });
        return {
            geometries: geometries,
            transferables: transferables,
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

    function calculateGeometry(quality) {
        var verts = [];
        var index = [];
        var color = [];

        updateNeighbours();

        for (var ox = 0; ox < cw * quality; ox++) {
            for (var oy = 0; oy < ch * quality; oy++) {
                for (var oz = 0; oz < cd * quality; oz++) {
                    addBlockGeometry(verts, index, color, ox / quality, oy / quality, oz / quality, quality);
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
                numItems: verts.length,
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

    function t(bl) {
        // Transparent
        return bl === 0x1;
    }

    function b(ox, oy, oz) {
        if (ox < 0) {
            return nxc ? nxc.block(cw - 1, oy, oz) : null;
        } else if (ox >= cw) {
            return pxc ? pxc.block(0, oy, oz) : null;
        } else if (oy < 0) {
            return nyc ? nyc.block(ox, ch - 1, oz) : null;
        } else if (oy >= ch) {
            return pyc ? pyc.block(ox, 0, oz) : null;
        } else if (oz < 0) {
            return nzc ? nzc.block(ox, oy, cd - 1) : null;
        } else if (oz >= cd) {
            return pzc ? pzc.block(ox, oy, 0) : null;
        } else {
            return blocks[ox*cw*ch + oy*cw + oz];
        }
    }

    function addBlockGeometry(verts, index, color, ox, oy, oz, quality) {
        var r = 1 / quality;
        var noise = [];
        if (transparent(ox, oy, oz)) return;

        var px = transparent(ox + r, oy, oz);
        var nx = transparent(ox - r, oy, oz);
        var py = transparent(ox, oy + r, oz);
        var ny = transparent(ox, oy - r, oz);
        var pz = transparent(ox, oy, oz + r);
        var nz = transparent(ox, oy, oz - r);

        var wx = ox + cx*cw;
        var wy = oy + cy*ch;
        var wz = oz + cz*cd;

        if (px) {
            v(wx + r, wy    , wz    );
            v(wx + r, wy + r, wz    );
            v(wx + r, wy + r, wz + r);
            v(wx + r, wy    , wz + r);
            v(wx + r, wy + r/2, wz + r/2);
            f(0);
        }
        if (nx) {
            v(wx, wy    , wz + r);
            v(wx, wy + r, wz + r);
            v(wx, wy + r, wz    );
            v(wx, wy    , wz    );
            v(wx, wy + r/2, wz + r/2);
            f(1);
        }
        if (py) {
            v(wx    , wy + r, wz + r);
            v(wx + r, wy + r, wz + r);
            v(wx + r, wy + r, wz    );
            v(wx    , wy + r, wz    );
            v(wx + r/2, wy + r, wz + r/2);
            f(2);
        }
        if (ny) {
            v(wx    , wy, wz    );
            v(wx + r, wy, wz    );
            v(wx + r, wy, wz + r);
            v(wx    , wy, wz + r);
            v(wx + r/2, wy, wz + r/2);
            f(3);
        }
        if (pz) {
            v(wx    , wy    , wz + r);
            v(wx + r, wy    , wz + r);
            v(wx + r, wy + r, wz + r);
            v(wx    , wy + r, wz + r);
            v(wx + r/2, wy + r/2, wz + r);
            f(4);
        }
        if (nz) {
            v(wx    , wy + r, wz);
            v(wx + r, wy + r, wz);
            v(wx + r, wy    , wz);
            v(wx    , wy    , wz);
            v(wx + r/2, wy + r/2, wz);
            f(5);
        }
        return;
        function mod(a, b) {
            return ((a % b) + b) % b;
        }
        function abs(n) {
            return Math.abs(n);
        }
        function inCenter(x, y, z) {
            return Math.abs(mod(x, 1) - 0.5) < 0.001 ||
                Math.abs(mod(y, 1) - 0.5) < 0.001 ||
                Math.abs(mod(z, 1) - 0.5) < 0.001;
        }
        function noiseFunc(x, y, z) {
            function n(q) {
                return perlinNoise(Math.abs(x)/q, Math.abs(y)/q, Math.abs(z)/q);
            }
            var val = n(8) + n(32);
            if (abs(r - 4) > 0.001) val += n(4);
            if (abs(r - 2) > 0.001) val += n(2);
            return clamp(val/2 + 0.5, 0.0, 1.0);
        }

        function v(x, y, z) {
            verts.push(x, y, z);
            noise.push(noiseFunc(x, y, z));
        }

        function f(mat, normal) {
            var l = verts.length / 3;
            // Each face is made up of two triangles
            index.push(l-5, l-4, l-1);
            index.push(l-4, l-3, l-1);
            index.push(l-3, l-2, l-1);
            index.push(l-2, l-5, l-1);

            var c, c2;
            // Dirt color from http://www.colourlovers.com/color/784800/dirt
            c = hex(0x784800);
            c2 = hex(0x000000);
            if (mat === 2) {
                c = hex(0x007608);
                c2 = hex(0x004E05);
            }

            for (var i = 0; i < 5; i++) {
                var n = noise.shift();
                var r = c.r*n + c2.r*(1 - n);
                var g = c.g*n + c2.g*(1 - n);
                var b = c.b*n + c2.b*(1 - n);
                color.push(r/255, g/255, b/255);
            }

            function hex(num) {
                return {
                    r: (num >> 16) & 0xFF,
                    g: (num >> 8)  & 0xFF,
                    b:  num        & 0xFF,
                };
            }
        }

        function anyTransparent(ox, oy, oz, w, h, d) {
            for (var x = 0; x < w; x++) {
                for (var y = 0; y < h; y++) {
                    for (var z = 0; z < d; z++) {
                        if (t(b(ox + x, oy + y, oz + z))) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        function allTransparent(ox, oy, oz, w, h, d) {
            for (var x = 0; x < r; x++) {
                for (var y = 0; y < r; y++) {
                    for (var z = 0; z < r; z++) {
                        if (!t(b(ox + x, oy + y, oz + z))) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function transparent(ox, oy, oz) {
            if (r === 1) {
                return t(b(ox, oy, oz));
            }

            if (ox < 0 || ox >= cw) {
                return anyTransparent(ox, oy, oz, 1, r, r);
            } else if (oy < 0 || oy >= ch) {
                return anyTransparent(ox, oy, oz, r, 1, r);
            } else if (oz < 0 || oz >= cd) {
                return anyTransparent(ox, oy, oz, r, r, 1);
            } else {
                return allTransparent(ox, oy, oz, r, r, r);
            }
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
