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

    var he = PLAYER_HALF_EXTENTS;
    var hitboxGeometry = new THREE.CubeGeometry(he.x*2, he.y*2, he.z*2);
    var hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);

    var bodyGeometry = new THREE.CubeGeometry(0.4, 1.3, 0.6);
    var bodyMesh = new THREE.Mesh(bodyGeometry, material);

    var headGeometry = new THREE.CubeGeometry(0.3, 0.3, 0.3);
    var headMesh = new THREE.Mesh(headGeometry, material);

    self.setPos = function (newPos) {
        pos = newPos;
        var p = pos;
        var h = PLAYER_HEIGHT;
        var bh = PLAYER_BODY_HEIGHT;
        bodyMesh.position.set(p.x, p.y - (h - bh)/2, p.z);
        headMesh.position.set(p.x, p.y + bh/2, p.z);
        hitboxMesh.position.set(p.x, p.y, p.z);
        return self;
    }

    self.contains = function (x, y, z) {
        var box = new Box(pos, PLAYER_HALF_EXTENTS);
        return box.contains(x, y, z);
    }

    self.setRot = function (newRot) {
        headMesh.rotation.set(newRot.x, newRot.y, newRot.z);
        var br = bodyMesh.rotation;
        br.y = newRot.y;
    }

    self.addTo = function (scene) {
        scene.add(bodyMesh);
        scene.add(headMesh);
        scene.add(hitboxMesh);
    }

    self.removeFrom = function (scene) {
        scene.remove(bodyMesh);
        scene.remove(headMesh);
        scene.remove(hitboxMesh);
    }
}

