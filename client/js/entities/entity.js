function Entity() {
    var self = this;

    var bodyGeometry = new THREE.CubeGeometry(0.5, 1.4, 1);
    var bodyMesh = new THREE.Mesh(bodyGeometry, new THREE.MeshBasicMaterial({wireframe: true}));
    var headGeometry = new THREE.CubeGeometry(0.4, 0.4, 0.4);
    var headMesh = new THREE.Mesh(headGeometry, new THREE.MeshBasicMaterial({wireframe: true}));

    self.setPos = function (newPos) {
        bodyMesh.position.set(newPos.x, newPos.y - 1.4 / 2, newPos.z);
        headMesh.position.set(newPos.x, newPos.y + 0.6, newPos.z);
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
}

function EntityHandler(scene, conn) {
    entities = {};
    conn.on('entity-position', function (payload) {
        var id = payload.id;
        if (!entities[id]) {
            entities[id] = new Entity();
            entities[id].addTo(scene);
            console.log("Created new entity with id ", id);
        }
        entities[id].setPos(payload.pos);
        entities[id].setRot(payload.rot);
    });
}
