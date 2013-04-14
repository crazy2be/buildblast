function World(scene, container) {
    var self = this;

    self.addToScene = function (mesh) {
        scene.add(mesh);
    }

    self.removeFromScene = function (mesh) {
        scene.remove(mesh);
    }

    var playerName = localStorage.playerName;
    if (!playerName) {
        do {
            playerName = prompt("Please enter your name.","Unknown");
        } while (playerName == null || playerName === "");
        localStorage.playerName = playerName;
    }
    var conn = new Conn(getWSURI("main/" + playerName));
    var controls = new Controls(container);
    var player = new Player(playerName, self, conn, controls);
    var chat = new Chat(controls, conn, container);

    var chunkManager = new ChunkManager(scene, player);
    var entityManager = new EntityManager(scene, conn);

    var ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    conn.on('block', processBlock);
    conn.on('debug-ray', processRay);

    function processBlock(payload) {
        var wx = payload.Pos.X;
        var wy = payload.Pos.Y;
        var wz = payload.Pos.Z;
        var type = payload.Type;
        applyBlockChange(wx, wy, wz, type);
    }

    function processRay(payload) {
        var pos = new THREE.Vector3(payload.Pos.x, payload.Pos.y, paylod.Pos.z);
        self.addSmallCube(pos);
    }

    self.update = function (dt) {
        player.update(dt);
        chunkManager.update(dt);
        chat.update(dt);
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
        if (block.empty()) {
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
                if (block && block.solid()) {
                    return oc.y + cc.y * CHUNK_HEIGHT + 1;
                }
            }
        } else if (block.solid()) {
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
                if (block && block.empty()) {
                    return oc.y + cc.y * CHUNK_HEIGHT;
                }
            }
        } else {
            throw "findClosestGround only knows how to deal with solid and empty. Got " + block.getType();
        }
    }

    var projector = new THREE.Projector();
    function findIntersection(camera, cb, precision, maxDist) {
        var precision = precision || 0.01;
        var maxDist = maxDist || 100;
        var look = new THREE.Vector3(0, 0, 1);
        // http://myweb.lmu.edu/dondi/share/cg/unproject-explained.pdf
        projector.unprojectVector(look, camera);

        var pos = camera.position;
        look.sub(pos).setLength(precision);

        var point = pos.clone();
        for (var dist = 0; dist < maxDist; dist += precision) {
            point.add(look);
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
        function mineable(x, y, z) {
            var block = self.blockAt(x, y, z);
            if (block) return block.mineable();
            else return false;
        }
        function removeBlock(wx, wy, wz) {
            changeBlock(wx, wy, wz, Block.AIR);
        }
        doLookedAtBlockAction(camera, mineable, removeBlock);
    }

    self.addLookedAtBlock = function (camera, blockType) {
        function empty(x, y, z) {
            var block = self.blockAt(x, y, z);
            if (block) return block.empty();
            else return false;
        }
        function addBlock(wx, wy, wz) {
            changeBlock(wx, wy, wz, blockType);
        }
        doLookedAtBlockAction(camera, empty, addBlock);
    }

    function changeBlock(wx, wy, wz, newType) {
        conn.queue('block', {
            Pos: {
                X: wx,
                Y: wy,
                Z: wz,
            },
            Type: newType,
        });
        applyBlockChange(wx, wy, wz, newType);
    }

    function applyBlockChange(wx, wy, wz, newType) {
        chunkManager.queueBlockChange(wx, wy, wz, newType);
    }
}
