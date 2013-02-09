function World(scene, conn) {
    var self = this;

    conn.on('chunk', processChunk);
    conn.on('unload-chunk', processUnloadChunk);
    conn.on('block', processBlock);

    var chunks = {};

    function chunkAt(cx, cy, cz) {
        var chunk = chunks[cx + "," + cy + "," + cz];
        return chunk;
    }

    self.chunkAt = chunkAt;

    function loadChunk(cx, cy, cz) {
        var chunk = chunkAt(cx, cy, cz);
        if (chunk) return chunk;
        else queueChunk(cx, cy, cz);
    }

    function queueChunk(cx, cy, cz) {
        conn.queue('chunk', {ccpos: {x: cx, y: cy, z: cz}});
    }

    function displayChunk(cx, cy, cz) {
        var chunk = loadChunk(cx, cy, cz);
        if (!chunk) return;
        if (chunk.isDisplayed()) return;
        chunk.addTo(scene);
        return chunk;
    }

    function processChunk(payload) {
        var pos = payload.ccpos;
        var cx = pos.x;
        var cy = pos.y;
        var cz = pos.z;
        var data = payload.data;
        console.log("Got chunk at ", cx, cy, cz);

        var chunk = chunkAt(cx, cy, cz);
        if (chunk) return;

        for (var ox = 0; ox < CHUNK_WIDTH; ox++) {
            for (var oy = 0; oy < CHUNK_HEIGHT; oy++) {
                for (var oz = 0; oz < CHUNK_DEPTH; oz++) {
                    data[ox][oy][oz] = new Block(data[ox][oy][oz]);
                }
            }
        }

        chunks[cx + "," + cy + "," + cz] = new Chunk(self, data, cx, cy, cz);
        displayChunk(cx, cy, cz);

        var pxc = chunkAt(cx + 1, cy, cz);
        if (pxc) pxc.refresh(scene);
        var nxc = chunkAt(cx - 1, cy, cz);
        if (nxc) nxc.refresh(scene);
        var pyc = chunkAt(cx, cy + 1, cz);
        if (pyc) pyc.refresh(scene);
        var nyc = chunkAt(cx, cy - 1, cz);
        if (nyc) nyc.refresh(scene);
        var pzc = chunkAt(cx, cy, cz + 1);
        if (pzc) pzc.refresh(scene);
        var nzc = chunkAt(cx, cy, cz - 1);
        if (nzc) nzc.refresh(scene);
    }

    function processUnloadChunk(payload) {
        var pos = payload.ccpos;
        var cx = pos.x;
        var cy = pos.y;
        var cz = pos.z;
        console.log("Unloading chunk at ", cx, cy, cz);

        var chunk = chunkAt(cx, cy, cz);
        if (!chunk) return;

        chunk.removeFrom(scene);
        delete chunks[cx + "," + cy + "," + cz];
    }

    function processBlock(payload) {
        var wx = payload.x;
        var wy = payload.y;
        var wz = payload.z;
        var type = payload.type;
        changeBlock(wx, wy, wz, new Block(type));
    }

    function mod(a, b) {
        return (((a % b) + b) % b);
    }

    self.addSmallCube = function (position) {
        if (!position) throw "Position required!";
        var cube = new THREE.Mesh( new THREE.CubeGeometry(0.1, 0.1, 0.1), new THREE.MeshNormalMaterial() );
        cube.position = position;
        console.log(position);
        scene.add(cube);
    }

    self.blockAt = function (wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var o = cords.o;
        var c = cords.c;

        var chunk = loadChunk(c.x, c.y, c.z);
        if (!chunk) return null;
        var block = chunk.blockAt(o.x, o.y, o.z);
        if (!block) throw "Could not load blockkk!!!";
        else return block;
    }

    self.findClosestGround = function (wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var c = cords.c;
        var o = cords.o;

        var chunk = loadChunk(c.x, c.y, c.z);
        if (!chunk) {
            return wy;
        }
        var block;
        if (chunk.blockAt(o.x, o.y, o.z).isType(Block.AIR)) {
            // Try and find ground below
            while (true) {
                if (o.y-- < 0) {
                    o.y = CHUNK_HEIGHT;
                    c.y--;
                    chunk = loadChunk(c.x, c.y, c.z);
                    if (!chunk) {
                        return o.y + 1 + c.y * CHUNK_HEIGHT;
                    }
                }
                block = chunk.blockAt(o.x, o.y, o.z);
                if (block && block.isType(Block.DIRT)) {
                    return o.y + c.y * CHUNK_HEIGHT + 1;
                }
            }
        } else if (chunk.blockAt(o.x, o.y, o.z).isType(Block.DIRT)) {
            // Try and find air above
            while (true) {
                if (o.y++ >= CHUNK_HEIGHT) {
                    o.y = 0;
                    c.y++;
                    chunk = loadChunk(c.x, c.y, c.z);
                    if (!chunk) {
                        return o.y + c.y * CHUNK_HEIGHT;
                    }
                }
                block = chunk.blockAt(o.x, o.y, o.z);
                if (block && block.isType(Block.AIR)) {
                    return o.y + c.y * CHUNK_HEIGHT;
                }
            }
        } else {
            throw "findClosestGround only knows how to deal with ground and air blocks.";
        }
    }

    self.findTargetIntersection = function (camera) {
        var vector = new THREE.Vector3(0, 0, 0);
        var projector = new THREE.Projector();
        projector.unprojectVector(vector, camera);
        vector.sub(camera.position).normalize();

        var raycaster = new THREE.Raycaster(camera.position, vector);
        return self.intersectRay(raycaster);
    }

    self.intersectRay = function (ray) {
        var closest;
        for (var key in chunks) {
            var chunk = chunks[key];
            var intersects = ray.intersectObject(chunk.getMesh());
            for (var i = 0; i < intersects.length; i++) {
                var intersect = intersects[i];
                if (!closest || intersect.distance < closest.distance) {
                    closest = intersect;
                }
            }
        }
        if (!closest) closest = { point: null, distance: null };
        return { p: closest.point, d: closest.distance };
    }

    function doLookedAtBlockAction(camera, cmp, cb) {
        var p = self.findTargetIntersection(camera).p;
        if (!p) return;

        var x = p.x;
        var y = p.y;
        var z = p.z;

        if (onFace(x)) {
            if (cmp(x + 0.5, y, z)) {
                cb(x + 0.5, y, z);
            } else {
                cb(x - 0.5, y, z);
            }
        } else if (onFace(y)) {
            if (cmp(x, y + 0.5, z)) {
                cb(x, y + 0.5, z);
            } else {
                cb(x, y - 0.5, z);
            }
        } else if (onFace(z)) {
            if (cmp(x, y, z + 0.5)) {
                cb(x, y, z + 0.5);
            } else {
                cb(x, y, z - 0.5);
            }
        } else {
            console.log("Could not find looked at block!");
        }
    }

    self.removeLookedAtBlock = function (camera) {
        function dirt(x, y, z) {
            var block = self.blockAt(x, y, z);
            if (block) return block.isType(Block.DIRT);
            else return false;
        }
        doLookedAtBlockAction(camera, dirt, removeBlock);
    }

    self.addLookedAtBlock = function (camera) {
        function air(x, y, z) {
            var block = self.blockAt(x, y, z);
            if (block) return block.isType(Block.AIR);
            else return false;
        }
        doLookedAtBlockAction(camera, air, addBlock);
    }

    function onFace(n) {
        if (abs(n % 1) < 0.001 || abs(n % 1 - 1) < 0.001 || abs(n % 1 + 1) < 0.001) return true;
        else return false;
    }

    function abs(n) {
        return Math.abs(n);
    }

    function removeBlock(wx, wy, wz) {
        changeBlock(wx, wy, wz, new Block(Block.AIR));
        conn.queue('block', {wx: wx, wy: wy, wz: wz, type: Block.AIR});
    }

    function addBlock(wx, wy, wz) {
        changeBlock(wx, wy, wz, new Block(Block.DIRT));
        conn.queue('block', {wx: wx, wy: wy, wz: wz, type: Block.DIRT});
    }

    function changeBlock(wx, wy, wz, newBlock) {
        var cords = worldToChunk(wx, wy, wz);
        var c = cords.c;
        var o = cords.o;

        var chunk = chunkAt(c.x, c.y, c.z);
        if (!chunk) return "Cannot find chunk to remove from!";
        var block = chunk.blockAt(o.x, o.y, o.z);
        if (!block) return "Cannot find block within chunk!";
        if (block.getType() === newBlock.getType()) return;
        block.setType(newBlock.getType());

        // Invalidate chunks
        var changedChunks = [];
        changedChunks.push(c);

        cords = worldToChunk(wx + 1, wy, wz);
        addToSet(changedChunks, cords.c);

        cords = worldToChunk(wx - 1, wy, wz);
        addToSet(changedChunks, cords.c);

        cords = worldToChunk(wx, wy + 1, wz);
        addToSet(changedChunks, cords.c);

        cords = worldToChunk(wx, wy - 1, wz);
        addToSet(changedChunks, cords.c);

        cords = worldToChunk(wx, wy, wz + 1);
        addToSet(changedChunks, cords.c);

        cords = worldToChunk(wx, wy, wz - 1);
        addToSet(changedChunks, cords.c);

        for (var i = 0; i < changedChunks.length; i++) {
            var c = changedChunks[i];
            var chunk = chunkAt(c.x, c.y, c.z);
            if (chunk) chunk.refresh(scene);
        }
    }

    function worldToChunk(wx, wy, wz) {
        return {
            c: {
                x: Math.floor(wx / CHUNK_WIDTH),
                y: Math.floor(wy / CHUNK_HEIGHT),
                z: Math.floor(wz / CHUNK_DEPTH),
                str: function() {
                    return this.x + "," + this.y + "," + this.z;
                }
            },
            o: {
                x: mod(Math.floor(wx), CHUNK_WIDTH),
                y: mod(Math.floor(wy), CHUNK_HEIGHT),
                z: mod(Math.floor(wz), CHUNK_DEPTH),
            }
        };
    }

    // Set is actually just an array.
    function addToSet(set, elm) {
        // Not really total equality
        function equal(a, b) {
            for (k in a) {
                if (a[k] !== b[k]) return false;
            }
            return true;
        }
        function arrayContians(a, elm) {
            for (var i = 0; i < a.length; i++) {
                if (equal(a[i], elm)) return true;
            }
            return false;
        }
        if (arrayContians(set, elm)) return;
        set.push(elm);
    }
}
