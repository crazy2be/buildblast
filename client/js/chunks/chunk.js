var CHUNK_MATERIAL = new THREE.MeshBasicMaterial({
    vertexColors: THREE.VertexColors,
//    transparent: true,
//    opacity: 0.5,
});

function Chunk(blocks, geometries, scene, quality) {
    var self = this;
    var cq = CHUNK_QUALITIES;
    var meshes = {};
    for (var i = 0; i < CHUNK_QUALITIES.length; i++) {
        var mesh = new THREE.Mesh(geometries[i], CHUNK_MATERIAL);
        meshes[cq[i]] = mesh;
    }

    self.remove = function () {
        scene.remove(meshes[quality]);
    }

    self.add = function () {
        scene.add(meshes[quality]);
    }

    self.setQuality = function (newQuality) {
        self.remove();
        quality = newQuality;
        self.add();
    }

    self.block = function (oc) {
        if (validChunkOffset(oc.x, oc.y, oc.z)) {
            // A single array is mesurably faster to
            // index (approximently twice as fast),
            // and is a lot less garbage to clean up.
            return new Block(blocks[
                oc.x * CHUNK_WIDTH * CHUNK_HEIGHT +
                oc.y * CHUNK_WIDTH +
                oc.z
            ]);
        } else {
            throw "block coords out of bounds: " + oc;
        }
    }
}
