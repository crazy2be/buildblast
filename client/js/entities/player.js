var PLAYER_EYE_HEIGHT = 1.6;
var PLAYER_HEIGHT = 1.75;
var PLAYER_BODY_HEIGHT = 1.3;
var PLAYER_DIST_CENTER_EYE = PLAYER_EYE_HEIGHT - PLAYER_BODY_HEIGHT/2;
var PLAYER_HALF_EXTENTS = new THREE.Vector3(
    0.2,
    PLAYER_HEIGHT / 2,
    0.2
);
var PLAYER_CENTER_OFFSET = new THREE.Vector3(
    0,
    -PLAYER_DIST_CENTER_EYE,
    0
);

function Player(name, world, conn, controls) {
    var self = this;

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1024);

    var blockInventory = new BlockInventory(world, camera);

    var weaponInventory = new WeaponInventory(world, camera)

    self.resize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };

    self.pos = function () {
        return camera.position.clone();
    }

    self.name = function () {
        return name;
    }

    self.update = function (dt) {
        var c = controls.sample();
        var p = camera.position;

        doLook(camera, p, c);
        calcNewPosition(dt, c);

        blockInventory.update(p, c);
        weaponInventory.update(p, c);

        updatePositionText(p);
        updateNetwork(dt, p, camera.rotation, c);
    };

    self.render = function (renderer, scene) {
        renderer.render(scene, camera);
    };

    conn.on('player-position', function (payload) {
        var p = payload.pos;
        camera.position.set(p.x, p.y, p.z);
        var r = payload.rot;
        camera.rotation.set(r.x, r.y, r.z);
    });

    function round(n, digits) {
        var factor = Math.pow(10, digits);
        return Math.round(n * factor) / factor;
    }

    function doLook(camera, p, c) {
        var target = new THREE.Vector3();
        target.x = p.x + sin(c.lat) * cos(c.lon);
        target.y = p.y + cos(c.lat);
        target.z = p.z + sin(c.lat) * sin(c.lon);
        camera.lookAt(target);
    }

    var box = new Box(camera.position, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);
    var velocityY = 0;
    function calcNewPosition(dt, c) {
        velocityY += dt * -9.81;

        var v = 10;
        var fw = dt*v*(c.forward ? 1 : c.back ? -1 : 0);
        var rt = dt*v*(c.right ? 1 : c.left ? -1 : 0);
        var move = {
            x: -cos(c.lon) * fw + sin(c.lon) * rt,
            y: velocityY * dt,
            z: -sin(c.lon) * fw - cos(c.lon) * rt,
        };

        box.attemptMove(world, move);
        if (move.y === 0) {
            velocityY = c.jump ? 6 : 0;
        }
    }

    function updatePositionText(p) {
        var info = document.getElementById('info');
        if (!info) return;

        info.innerHTML = JSON.stringify({
            x: round(p.x, 2),
            y: round(p.y, 2),
            z: round(p.z, 2),
            v: round(velocityY, 2),
        });
    }

    var accumulatedTime = 0;
    var interval = 1/20;
    function updateNetwork(dt, p, r, c) {
        accumulatedTime += dt;

        if (accumulatedTime < interval) return;

        accumulatedTime -= interval;

        if (accumulatedTime > 1) {
            console.warn("Having trouble keeping up with minimum update speed of 10fps! (", accumulatedTime, " seconds behind). Trouble ahead...");
            accumulatedTime = 0;
        }

        conn.queue('player-position', {
            pos: {x: p.x, y: p.y, z: p.z},
            rot: {x: r.x, y: r.y, z: r.z},
        });
        conn.queue('controls-state', {
            controls: c,
            timestamp: window.performance.now(),
        });
    }
};
