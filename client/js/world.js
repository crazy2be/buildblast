function World(scene, container) {
    var self = this;

    self.addToScene = function (mesh) {
        scene.add(mesh);
    }

    self.removeFromScene = function (mesh) {
        scene.remove(mesh);
    }

    var playerName = "player-" + Math.random();
    var conn = new Conn(getWSURI("main/" + playerName));
    var controls = new Controls(container);
    var player = new Player(playerName, self, conn, controls);

    var chunkManager = new ChunkManager(scene, player);
    var entityManager = new EntityManager(scene, conn);

    var ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    conn.on('block', processBlock);

    function processBlock(payload) {
        var wx = payload.x;
        var wy = payload.y;
        var wz = payload.z;
        var type = payload.type;
        applyBlockChange(wx, wy, wz, type);
    }

    self.update = function (dt) {
        player.update(dt);
        chunkManager.update(dt);
    }

    self.render = player.render;
    self.resize = player.resize;

    self.addSmallCube = function (position) {
        if (!position) throw "Position required!";
        var cube = new THREE.Mesh( new THREE.CubeGeometry(0.1, 0.1, 0.1), new THREE.MeshNormalMaterial() );
        cube.position = position;
        scene.add(cube);
    }

    self.blockAt = function (wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var oc = cords.o;
        var cc = cords.c;

        var chunk = chunkManager.chunk(cc);
        if (!chunk) return null;
        var block = chunk.block(oc);
        if (!block) throw "Could not load blockkk!!!";
        else return block;
    }

    self.findClosestGround = function (wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var cc = cords.c;
        var oc = cords.o;

        var chunk = chunkManager.chunk(cc);
        if (!chunk) {
            return false;
        }
        var block = chunk.block(oc);
        if (block.isType(Block.AIR)) {
            // Try and find ground below
            while (true) {
                oc.y--;
                if (oc.y < 0) {
                    oc.y = CHUNK_HEIGHT - 1;
                    cc.y--;
                    chunk = chunkManager.chunk(cc);
                    if (!chunk) {
                        return oc.y + cc.y * CHUNK_HEIGHT + 1;
                    }
                }
                block = chunk.block(oc);
                if (block && block.isType(Block.DIRT)) {
                    return oc.y + cc.y * CHUNK_HEIGHT + 1;
                }
            }
        } else if (block.isType(Block.DIRT)) {
            // Try and find air above
            while (true) {
                oc.y++;
                if (oc.y >= CHUNK_HEIGHT) {
                    oc.y = 0;
                    cc.y++;
                    chunk = chunkManager.chunk(cc);
                    if (!chunk) {
                        return oc.y + cc.y * CHUNK_HEIGHT;
                    }
                }
                block = chunk.block(oc);
                if (block && block.isType(Block.AIR)) {
                    return oc.y + cc.y * CHUNK_HEIGHT;
                }
            }
        } else {
            throw "findClosestGround only knows how to deal with ground and air blocks. Got " + block.getType();
        }
    }

    function findIntersection(camera, cb, precision, maxDist) {
        var precision = precision || 0.01;
        var maxDist = maxDist || 100;
        var look = new THREE.Vector3(0, 0, 0);
        var projector = new THREE.Projector();
        projector.unprojectVector(look, camera);

        look.sub(camera.position).setLength(precision);

        var point = camera.position.clone();
        var dist = 0;
        while (dist < maxDist) {
            point.add(look);
            dist = camera.position.distanceTo(point);
            var collision = cb(point.x, point.y, point.z);
            if (collision) {
                return {
                    point: point,
                    dist: dist,
                    item: collision,
                };
            }
        }
    }

    self.findPlayerIntersection = function (camera) {
        function entityAt(wx, wy, wz) {
            return entityManager.entityAt(wx, wy, wz);
        }
        return findIntersection(camera, entityAt, 0.1);
    }

    self.findBlockIntersection = function (camera) {
        function blockAt(wx, wy, wz) {
            var block = self.blockAt(wx, wy, wz);
            return block && block.mineable();
        }
        return findIntersection(camera, blockAt);
    }

    function doLookedAtBlockAction(camera, cmp, cb) {
        var intersect = self.findBlockIntersection(camera);
        if (!intersect) {
            console.log("You aren't looking at anything!");
            return;
        }
        var p = intersect.point;

        function onFace(n) {
            if (abs(n % 1) < 0.01 || abs(n % 1 - 1) < 0.01 || abs(n % 1 + 1) < 0.01) return true;
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
        conn.queue('block', {
            x: wx,
            y: wy,
            z: wz,
            type: newType,
        });
        applyBlockChange(wx, wy, wz, newType);
    }

    function applyBlockChange(wx, wy, wz, newType) {
        chunkManager.queueBlockChange(wx, wy, wz, newType);
    }
}
