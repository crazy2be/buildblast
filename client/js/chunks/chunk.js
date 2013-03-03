var CHUNK_MATERIAL = new THREE.MeshBasicMaterial({
    vertexColors: THREE.VertexColors
});

function Chunk(blocks, geometries, scene, qred) {
    var self = this;
    var meshes = [];
    for (var i = 0; i < geometries.length; i++) {
        var mesh = new THREE.Mesh(geometries[i], CHUNK_MATERIAL);
        meshes.push(mesh);
    }

    self.remove = function () {
        if (qred === -1) return;
        scene.remove(meshes[qred]);
    }

    self.add = function () {
        if (qred === -1) return;
        scene.add(meshes[qred]);
    }

    self.hide = function () {
        for (var i = 0; i < meshes.length; i++) {
            meshes[i].visible = false;
        }
    }

    self.show = function () {
        meshes[qred].visible = true;
    }

    self.setQred = function (newQred) {
        if (newQred === -1) debugger;
        self.remove();
        qred = newQred;
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
