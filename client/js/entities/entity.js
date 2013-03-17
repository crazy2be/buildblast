function Entity() {
    var self = this;

    var pos;

    var material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true,
    });
    var hitboxMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
    });
    var hitboxGeometry = new THREE.CubeGeometry(0.4, PLAYER_HEIGHT, 0.4);
    var hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    var bodyGeometry = new THREE.CubeGeometry(0.4, 1.3, 0.6);
    var bodyMesh = new THREE.Mesh(bodyGeometry, material);
    var headGeometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
    var headMesh = new THREE.Mesh(headGeometry, material);

    self.setPos = function (newPos) {
        pos = newPos;
        var p = pos;
        bodyMesh.position.set(p.x, p.y - PLAYER_EYE_HEIGHT + 1.3/2, p.z);
        headMesh.position.set(p.x, p.y, p.z);
        hitboxMesh.position.set(p.x, p.y, p.z);
        return self;
    }

    self.contains = function (x, y, z) {
        var halfExtents = new THREE.Vector3(
            0.2,
            PLAYER_HEIGHT / 2,
            0.2
        );
        var box = new Box(pos, halfExtents);
        return box.contains(x, y, z);
    }

    self.setRot = function (newRot) {
        headMesh.rotation.set(newRot.x, newRot.y, newRot.z);
        var br = bodyMesh.rotation;
        br.y = newRot.y;
    }

    self.addTo = function (scene) {
//         scene.add(bodyMesh);
//         scene.add(headMesh);
        scene.add(hitboxMesh);
    }

    self.removeFrom = function (scene) {
//         scene.remove(bodyMesh);
//         scene.remove(headMesh);
        scene.remove(hitboxMesh);
    }
}

