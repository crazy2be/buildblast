function World(scene, conn) {
    var self = this;
    var chunkManager = new ChunkManager(scene, conn);

    conn.on('block', processBlock);

    var chunkAt = chunkManager.chunkAt;

    function processBlock(payload) {
        var wx = payload.x;
        var wy = payload.y;
        var wz = payload.z;
        var type = payload.type;
        applyBlockChange(wx, wy, wz, type);
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

        var chunk = chunkAt(c.x, c.y, c.z);
        if (!chunk) return null;
        var block = chunk.blockAt(o.x, o.y, o.z);
        if (!block) throw "Could not load blockkk!!!";
        else return block;
    }

    self.findClosestGround = function (wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var c = cords.c;
        var o = cords.o;

        var chunk = chunkAt(c.x, c.y, c.z);
        if (!chunk) {
            return wy;
        }
        var block = chunk.blockAt(o.x, o.y, o.z);
        if (block.isType(Block.AIR)) {
            // Try and find ground below
            while (true) {
                if (o.y-- < 0) {
                    o.y = CHUNK_HEIGHT;
                    c.y--;
                    chunk = chunkAt(c.x, c.y, c.z);
                    if (!chunk) {
                        return o.y + 1 + c.y * CHUNK_HEIGHT;
                    }
                }
                block = chunk.blockAt(o.x, o.y, o.z);
                if (block && block.isType(Block.DIRT)) {
                    return o.y + c.y * CHUNK_HEIGHT + 1;
                }
            }
        } else if (block.isType(Block.DIRT)) {
            // Try and find air above
            while (true) {
                if (o.y++ >= CHUNK_HEIGHT) {
                    o.y = 0;
                    c.y++;
                    chunk = chunkAt(c.x, c.y, c.z);
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
            throw "findClosestGround only knows how to deal with ground and air blocks. Got " + block.getType();
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
        var chunks = chunkManager.chunks();
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

        function onFace(n) {
            if (abs(n % 1) < 0.001 || abs(n % 1 - 1) < 0.001 || abs(n % 1 + 1) < 0.001) return true;
            else return false;
        }

        function abs(n) {
            return Math.abs(n);
        }

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
        function removeBlock(wx, wy, wz) {
            changeBlock(wx, wy, wz, Block.AIR);
        }
        doLookedAtBlockAction(camera, dirt, removeBlock);
    }

    self.addLookedAtBlock = function (camera) {
        function air(x, y, z) {
            var block = self.blockAt(x, y, z);
            if (block) return block.isType(Block.AIR);
            else return false;
        }
        function addBlock(wx, wy, wz) {
            changeBlock(wx, wy, wz, Block.DIRT);
        }
        doLookedAtBlockAction(camera, air, addBlock);
    }

    function changeBlock(wx, wy, wz, newType) {
        conn.queue('block', {x: wx, y: wy, z: wz, type: newType});
        applyBlockChange(wx, wy, wz, newType);
    }

    function applyBlockChange(wx, wy, wz, newType) {
        var cords = worldToChunk(wx, wy, wz);
        var c = cords.c;
        var o = cords.o;

        var chunk = chunkAt(c.x, c.y, c.z);
        if (!chunk) {
            console.warn("Cannot find chunk to remove from!");
            return;
        }
        var block = chunk.blockAt(o.x, o.y, o.z);
        if (!block) throw "Cannot find block within chunk!";
        if (block.type === newType) return;
        chunk.setBlock(o.x, o.y, o.z, newType);

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

    // Set is actually just an array.
    function addToSet(set, elm) {
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

    function mod(a, b) {
        return (((a % b) + b) % b);
    }

    function worldToChunk(wx, wy, wz) {
        return {
            c: {
                x: Math.floor(wx / CHUNK_WIDTH),
                y: Math.floor(wy / CHUNK_HEIGHT),
                z: Math.floor(wz / CHUNK_DEPTH),
            },
            o: {
                x: mod(Math.floor(wx), CHUNK_WIDTH),
                y: mod(Math.floor(wy), CHUNK_HEIGHT),
                z: mod(Math.floor(wz), CHUNK_DEPTH),
            }
        };
    }
}