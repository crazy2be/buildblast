function World(scene) {
    var WS_OPEN = 1;
    var self = this;
    
    var ws = (function () {
        var loc = window.location;
        var uri = loc.protocol === "https:" ? "wss:" : "ws:";
        uri += "//" + loc.host + "/ws";
        return new WebSocket(uri);
    }());
    
    var messageQueue = [];
    function queueMessage(obj) {
        if (ws.readyState === WS_OPEN) {
            ws.send(JSON.stringify(obj));
        } else {
            messageQueue.push(obj);
        }
    }
    ws.onopen = function () {
        for (var i = 0; i < messageQueue.length; i++) {
            ws.send(JSON.stringify(messageQueue[i]));
        }
    }
    
    ws.onmessage = function (ev) {
        console.log(ev.data);
        var o = JSON.parse(ev.data);
        switch (o.Kind) {
            case "chunk":
                processChunk(o.Payload);
                break;
            case "block":
                processBlock(o.Payload);
                break;
            default:
                console.warn("Recieved server message of unknown type: " + o.Kind);
        }
    }
    
    ws.onerror = function (ev) {
        console.error(ev);
    }
    
    ws.onclose = function (ev) {
        console.error("Someone closed my websocket :(", ev);
    }
    
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
        queueMessage({
            kind: 'chunk',
            payload: {
                cx: cx,
                cy: cy,
                cz: cz,
            },
        });
    }   
    
    function displayChunk(cx, cy, cz) {
        var chunk = loadChunk(cx, cy, cz);
        if (!chunk) return;
        if (chunk.isDisplayed()) return;
        chunk.addTo(scene);
        return chunk;
    }
    
    function processChunk(payload) {
        var cx = payload.cx;
        var cy = payload.cy;
        var cz = payload.cz;
        var data = payload.data;
        
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
    
    function processBlock(payload) {
        var wx = payload.wx;
        var wy = payload.wy;
        var wz = payload.wz;
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
                    return o.y + 1 + c.y * CHUNK_HEIGHT;
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
    
    self.findWorldIntersection = function (camera) {
        var vector = new THREE.Vector3(0, 0, 0);
        var projector = new THREE.Projector();
        projector.unprojectVector(vector, camera);
        vector.sub(camera.position).normalize();
        
        var raycaster = new THREE.Raycaster(camera.position, vector);
        var closest = {
            distance: 100,
        }
        for (var key in chunks) {
            var chunk = chunks[key];
            var intersects = raycaster.intersectObject(chunk.getMesh());
            for (var i = 0; i < intersects.length; i++) {
                var intersect = intersects[i];
                if (intersect.distance < closest.distance) {
                    closest = intersect;
                }
            }
        }
        return closest.point;
    }
    
    self.removeLookedAtBlock = function (camera) {
        var p = self.findWorldIntersection(camera);
        if (!p) return;
        
        var x = p.x;
        var y = p.y;
        var z = p.z;
        function dirt(x, y, z) {
            var block = self.blockAt(x, y, z);
            if (block) return block.isType(Block.DIRT);
            else return false;
        }
        
        if (onFace(x)) {
            if (dirt(x + 0.5, y, z)) {
                removeBlock(x + 0.5, y, z);
            } else {
                removeBlock(x - 0.5, y, z);
            }
        } else if (onFace(y)) {
            if (dirt(x, y + 0.5, z)) {
                removeBlock(x, y + 0.5, z);
            } else {
                removeBlock(x, y - 0.5, z);
            }
        } else if (onFace(z)) {
            if (dirt(x, y, z + 0.5)) {
                removeBlock(x, y, z + 0.5);
            } else {
                removeBlock(x, y, z - 0.5);
            }
        } else {
            console.log("Could not find looked at block!");
        }
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
        queueMessage({
            kind: 'block',
            payload: {
                wx: wx,
                wy: wy,
                wz: wz,
                typ: Block.AIR,
            }
        });
    }
    
    function changeBlock(wx, wy, wz, newBlock) {
        var cords = worldToChunk(wx, wy, wz);
        var c = cords.c;
        var o = cords.o;
        
        var chunk = chunkAt(c.x, c.y, c.z);
        if (!chunk) throw "Cannot find chunk to remove from!";
        var block = chunk.blockAt(o.x, o.y, o.z);
        if (!block) throw "Cannot find block within chunk!";
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
