var Player = function (world, container, conn) {
    var self = this;

    var height = 1.6;
    var velocityY = 0;

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200);

    var controls = new FirstPersonControls(world, camera, container);

    self.getHeight = function () {
        return height;
    };

    self.resize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        controls.handleResize();
    };

    conn.on('player-position', function (payload) {
        var cp = camera.position;
        var dp = payload.pos;
        cp.x = dp.x;
        cp.y = dp.y;
        cp.z = dp.z;
    });

    var accumulatedTime = 0;
    self.update = function (dt) {
        controls.update(dt);

        var p = camera.position;
        var r = camera.rotation;
        var y = world.findClosestGround(p.x, p.y - height, p.z) + height;

        if (Math.abs(p.y - y) < 0.001) {
            p.y = y;
            velocityY = 0;
        } else {
            velocityY += dt * 0.2 * -9.81;
        }

        if (controls.isJumping()) {
            velocityY = 0.5;
            controls.jumped();
        }
        p.y += Math.max(y - p.y, velocityY);

        accumulatedTime += dt;
        if (accumulatedTime > 0.1) {
            accumulatedTime = 0;
            conn.queue('player-position', {
                pos: {x: p.x, y: p.y, z: p.z},
                rot: {x: r.x, y: r.y, z: r.z},
            });
        }
    };

    self.render = function (renderer, scene) {
        renderer.render(scene, camera);
    };
};
