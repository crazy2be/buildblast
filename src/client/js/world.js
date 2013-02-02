function World(scene) {
    var self = this;

    var seed = Math.random() * 100;
    
    var chunks = {};
    
    function chunkAt(cx, cy, cz) {
        var chunk = chunks[cx + "," + cy + "," + cz];
        return chunk;
    }
    
    function createChunk(cx, cy, cz) {
        var chunk = chunkAt(cx, cy, cz);
        if (!chunk) {
            chunk = Chunk.generateChunk(cx, cy, cz, self);
            chunks[cx + "," + cy + "," + cz] = chunk;
        }
        return chunk;
    }
    
    self.createChunk = createChunk;
    
    function displayChunk(cx, cy, cz) {
        var chunk = createChunk(cx, cy, cz);
        if (chunk.isDisplayed()) return chunk;
        chunk.addTo(scene);
        return chunk;
    }
    
    function mod(a, b) {
        return (((a % b) + b) % b);
    }
    
    self.getSeed = function () {
        return seed;
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
        
        var chunk = createChunk(c.x, c.y, c.z);
        var block = chunk.blockAt(o.x, o.y, o.z);
        if (!block) throw "Could not load blockkk!!!";
        else return block;
    }
    
    self.findClosestGround = function (wx, wy, wz) {
        var cords = worldToChunk(wx, wy, wz);
        var c = cords.c;
        var o = cords.o;
        
        var chunk = displayChunk(c.x, c.y, c.z);
        var block;
        if (chunk.blockAt(o.x, o.y, o.z).isType(Block.AIR)) {
            // Try and find ground below
            while (true) {
                if (o.y-- < 0) {
                    o.y = CHUNK_HEIGHT;
                    c.y--;
                    chunk = displayChunk(c.x, c.y, c.z);
                }
                block = chunk.blockAt(o.x, o.y, o.z);
                if (block && block.isType(Block.DIRT)) {
                    return o.y + c.y * CHUNK_HEIGHT;
                }
            }
        } else if (chunk.blockAt(o.x, o.y, o.z).isType(Block.DIRT)) {
            // Try and find air above
            while (true) {
                if (o.y++ >= CHUNK_HEIGHT) {
                    o.y = 0;
                    c.y++;
                    chunk = displayChunk(c.x, c.y, c.z);
                }
                block = chunk.blockAt(o.x, o.y, o.z);
                if (block && block.isType(Block.AIR)) {
                    return o.y - 1 + c.y * CHUNK_HEIGHT;
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
        for (var key in chunks) {
            var chunk = chunks[key];
            var intersects = raycaster.intersectObject(chunk.getMesh());
            if (intersects.length > 0) {
                return intersects[0].point;
            }
        }
    }
    
    self.removeLookedAtBlock = function (camera) {
        var p = self.findWorldIntersection(camera);
        if (!p) return;
        
        var x = p.x;
        var y = p.y;
        var z = p.z;
        function dirt(x, y, z) {
            return self.blockAt(x, y, z).isType(Block.DIRT);
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
        var cords = worldToChunk(wx, wy, wz);
        var c = cords.c;
        var o = cords.o;
        
        var chunk = chunkAt(c.x, c.y, c.z);
        if (!chunk) throw "Cannot find chunk to remove from!";
        var block = chunk.blockAt(o.x, o.y, o.z);
        if (!block) throw "Cannot find block within chunk!";
        block.setType(Block.AIR);
        
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
            var c = changedChunks[i]
            createChunk(c.x, c.y, c.z).refresh(scene);
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
                x: Math.floor(mod(wx, CHUNK_WIDTH)),
                y: Math.floor(mod(wy, CHUNK_HEIGHT)),
                z: Math.floor(mod(wz, CHUNK_DEPTH)),
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
