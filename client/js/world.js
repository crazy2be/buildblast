function World(scene, container) {
    var self = this;

    var playerName = "player-" + Math.random();
    var conn = new Conn(getWSURI("main/" + playerName));
    var controls = new Controls(container);
    var player = new Player(playerName, self, conn, controls);

    var chunkManager = new ChunkManager(scene, conn, player);
    var entityHandler = new EntityHandler(scene, conn);
    
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

    self.findTargetIntersection = function (camera) {
        var precision = 0.01;
        var maxDist = 100;
        var look = new THREE.Vector3(0, 0, 0);
        var projector = new THREE.Projector();
        projector.unprojectVector(look, camera);

        look.sub(camera.position).setLength(precision);

        var point = camera.position.clone();
        var dist = 0;
        while (dist < maxDist) {
            point.add(look);
            dist = camera.position.distanceTo(point);
            var block = self.blockAt(point.x, point.y, point.z);
            if (block && block.mineable()) {
                return {
                    point: point,
                    dist: dist,
                    block: block,
                }
            }
        }
    }

    function doLookedAtBlockAction(camera, cmp, cb) {
        var intersect = self.findTargetIntersection(camera);
        if (!intersect) return;
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
    
    // DEBUG - Ignore this nightmare
    self.addTest = function (camera) {
        function dirt(x, y, z) {
            var block = self.blockAt(x, y, z);
            if (block) return block.isType(Block.DIRT);
            else return false;
        }

        function addModel(wx, wy, wz) {
            if (document.xxloader) {
                return;
            }
            if (!document.xxgeom) {
                loadModel('sniper');
            } else {
                var model = new THREE.Mesh(document.xxgeom, new THREE.MeshFaceMaterial(document.xxmats));
                model.scale.set(1, 1, -1);
                model.position.set(wx, wy + 2, wz);
                scene.add(model);
            }
        }
        doLookedAtBlockAction(camera, dirt, addModel);
    }

    function loadModel (modelName) {
        document.xxloader = new THREE.JSONLoader();
        document.xxloader.load('models/' + modelName + '/' + modelName + '.js',
            function (geometry, mats) {
                document.xxgeom = geometry;
                document.xxmats = mats;
                document.xxloader = false;
            }
        );
    }
    // END DEBUG

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
