function World(scene, container) {
    var self = this;

    self.addToScene = function (mesh) {
        scene.add(mesh);
    }

    self.removeFromScene = function (mesh) {
        scene.remove(mesh);
    }

    var playerName = localStorage.playerName;
    while (!playerName) {
        playerName = prompt("Please enter your name.","Unknown");
        localStorage.playerName = playerName;
    }
    var conn = new Conn(getWSURI("main/" + playerName));
    var controls = new Controls(container);
    var player = new Player(playerName, self, conn, controls);
    var chat = new Chat(controls, conn, container);

    var chunkManager = new ChunkManager(scene, player);
    var entityManager = new EntityManager(scene, conn, player);
    window.testExposure.chunkManager = chunkManager;
    window.testExposure.entityManager = entityManager;

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
        var pos = new THREE.Vector3(payload.Pos.X, payload.Pos.Y, payload.Pos.Z);
        self.addSmallCube(pos);
    }

    self.update = function (dt) {
        player.update(dt);
        chunkManager.update(dt);
        chat.update(dt);
    }

    self.render = player.render;
    self.resize = player.resize;

    var smallCube = new THREE.CubeGeometry(0.1, 0.1, 0.1);
    var smallCubeMat = new THREE.MeshNormalMaterial();
    self.addSmallCube = function (position) {
        if (!position) throw "Position required!";
        var cube = new THREE.Mesh( smallCube, smallCubeMat );
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
                if (block && !block.empty()) {
                    return oc.y + cc.y * CHUNK_HEIGHT + 1;
                }
            }
        } else if (!block.empty()) {
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
    function findIntersection(point, look, criteriaFnc, precision, maxDist) {
        var precision = precision || 0.01;
        var maxDist = maxDist || 100;

        point = point.clone();

        look = look.clone();
        look.setLength(precision);

        for (var dist = 0; dist < maxDist; dist += precision) {
            point.add(look);
            var collision = criteriaFnc(point.x, point.y, point.z);
            if (collision) {
                return {
                    point: point,
                    dist: dist,
                    item: collision,
                };
            }
        }
    }

    self.findPlayerIntersection = function (camera, precision) {
        function entityAt(wx, wy, wz) {
            return entityManager.entityAt(wx, wy, wz);
        }
        return findIntersection(camera.position, getLookedAtDirection(camera), entityAt, precision);
    }

    function findSolidBlockIntersection(camera, precision) {
        function blockAt(wx, wy, wz) {
            var block = self.blockAt(wx, wy, wz);
            return block && !block.empty();
        }
        return findIntersection(camera.position, getLookedAtDirection(camera), blockAt, precision);
    }

    function getLookedAtDirection(camera) {
        var look = new THREE.Vector3(0, 0, 1);
        // http://myweb.lmu.edu/dondi/share/cg/unproject-explained.pdf
        projector.unprojectVector(look, camera);
        return look.sub(camera.position);
    }

    //wantSolidBlock is true or false, and describes whether a solid block is requested,
    //  or the block right before the solid block (so for example and air block right before the solid block).
    //return a THREE.Vector3 which is the position of the block.
    self.getLookedAtBlock = function(camera, wantSolidBlock) {
        //Very important, without specifying this we cannot accurately backup to find
        //a block before a solid block!
        var precision = 0.1;

        var intersect = findSolidBlockIntersection(camera, precision);
        if (!intersect) {
            console.log("You aren't looking at anything!");
            return;
        }
        var p = intersect.point;

        if(!wantSolidBlock) {
            //We backup to the last point, so should be the block directly before a solid.
            var cameraDirection = getLookedAtDirection(camera).setLength(precision);
            p.sub(cameraDirection);
        }

        return p;
    }

    self.changeBlock = function(wx, wy, wz, newType) {
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
