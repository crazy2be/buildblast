function Entity() {
    var self = this;

    var material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true,
    });
    var bodyGeometry = new THREE.CubeGeometry(0.4, 1.3, 0.6);
    var bodyMesh = new THREE.Mesh(bodyGeometry, material);
    var headGeometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
    var headMesh = new THREE.Mesh(headGeometry, material);

    self.setPos = function (newPos) {
        var p = newPos;
        bodyMesh.position.set(p.x, p.y - PLAYER_EYE_HEIGHT + 1.3/2, p.z);
        headMesh.position.set(p.x, p.y, p.z);
        return self;
    }

    self.setRot = function (newRot) {
        headMesh.rotation.set(newRot.x, newRot.y, newRot.z);
        var br = bodyMesh.rotation;
        br.y = newRot.y;
    }

    self.addTo = function (scene) {
        scene.add(bodyMesh);
        scene.add(headMesh);
    }

    self.removeFrom = function (scene) {
        scene.remove(bodyMesh);
        scene.remove(headMesh);
    }
}

function EntityHandler(scene, conn) {
    entities = {};
    conn.on('entity-create', function (payload) {
        var id = payload.id;
        if (entities[id]) {
            console.warn("Got entity-create message for entity which already exists!", id);
            return;
        }
        var entity = new Entity();
        entity.addTo(scene);
        entities[id] = entity;
    });
    conn.on('entity-position', function (payload) {
        var id = payload.id;
        var entity = entities[id];
        if (!entity) {
            console.warn("Got entity-position message for entity which does not exist!", id);
        }
        entity.setPos(payload.pos);
        entity.setRot(payload.rot);
    });
    conn.on('entity-remove', function (payload) {
        var id = payload.id;
        var entity = entities[id];
        if (!entity) {
            console.warn("Got entity-remove command for entity which does not exist: ", id);
        }
        entity.removeFrom(scene);
        delete entities[id];
    });
}
