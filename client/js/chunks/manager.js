function ChunkManager(scene, player) {
    var self = this;

    var vertStatsSimple = null;
    var vertStatsGreedy = null;
    if(settings.showGeometryGraph) {
        vertStatsSimple = new PerfChart({
            title: ' verts'
        });
        vertStatsSimple.elm.style.position = 'absolute';
        vertStatsSimple.elm.style.top = '74px';
        vertStatsSimple.elm.style.right = '160px';
        document.getElementById('container').appendChild(vertStatsSimple.elm);

        vertStatsGreedy = new PerfChart({
            title: ' verts'
        });
        vertStatsGreedy.elm.style.position = 'absolute';
        vertStatsGreedy.elm.style.top = '74px';
        vertStatsGreedy.elm.style.right = '240px';
        document.getElementById('container').appendChild(vertStatsGreedy.elm);
    }

    var chunks = {};
    var geometryWorker = new Worker('js/chunks/worker/worker.js');
    startChunkConn(player.name());

    self.chunk = function (cc) {
        return chunks[ccStr(cc)];
    }

    var accumulatedTime = 0;
    self.update = function (dt) {
        accumulatedTime += dt;
        if (accumulatedTime > 1) {
            accumulatedTime -= 1;
            var p = player.pos();
            geometryWorker.postMessage({
                'kind': 'player-position',
                'payload': {
                    'pos': {x: p.x, y: p.y, z: p.z},
                },
            })
        }

    }

    self.queueBlockChange = function (wx, wy, wz, newType) {
        geometryWorker.postMessage({
            'kind': 'block-change',
            'payload': {
                'Pos': {X: wx, Y: wy, Z: wz},
                'Type': newType,
            }
        });
    }

    geometryWorker.onmessage = function (e) {
        var payload = e.data.payload;
        if (e.data.kind === 'chunk') {
            processChunk(payload);
        } else if (e.data.kind === 'show-chunk') {
            processShowChunk(payload);
        } else if (e.data.kind === 'hide-chunk') {
            processHideChunk(payload);
        } else if (e.data.kind === 'chunk-quality-change') {
            processQualityChange(payload);
        } else if (e.data.kind === 'log') {
            console.log(e.data.payload);
        }
    }

    geometryWorker.onerror = fatalError;

    function startChunkConn(name) {
        geometryWorker.postMessage({
            'kind': 'start-conn',
            'payload': {
                'uri': getWSURI('chunk/' + name),
            },
        })
    }

    //Processes a geometry created by the worker thread which describes a chunk
    //(as in, DOES NOT process a chunk sent from the server to the client...)
    function processChunk(payload) {
        var pg = payload.geometries;
        var geometries = [];
        //Geometry for each quality (as in, far away, medium, close, etc... we
        //'pixelate' cubes that are far away).
        for (var i = 0; i < pg.length; i++) {
            var geometry = new THREE.BufferGeometry();
            geometry.attributes = pg[i].attributes;
            //Why is this needed? Doesn't seem to provide any more benefit than
            //just adding multiple geometries. If you know why, tell Quentin.
            geometry.offsets = pg[i].offsets;
            geometries.push(geometry);
        }

        var cc = payload.ccpos;

        var chunk = self.chunk(cc);
        if (chunk) chunk.remove();

        chunk = new Chunk(payload.blocks, geometries, scene, payload.quality);
        chunk.add();
        chunks[ccStr(cc)] = chunk;

        console.log("Added chunk at ", cc);

        if(settings.showGeometryGraph) {
            var simpleVertCount = pg[0].testData.simple.verticeCount;
            var greedyVertCount = pg[0].testData.greedy.verticeCount;

            if(greedyVertCount) {
                vertStatsSimple.addDataPoint(simpleVertCount/greedyVertCount);
                vertStatsGreedy.addDataPoint(greedyVertCount);
            }
        }
    }

    function processQualityChange(payload) {
        var chunk = self.chunk(payload.ccpos);
        if (!chunk) {
            console.warn("Got qred change command for chunk that is not loaded. Likely server bug.");
            return;
        }

        chunk.setQuality(payload.quality);
    }
}
