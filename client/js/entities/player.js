var PLAYER_EYE_HEIGHT = 1.6;
var PLAYER_HEIGHT = 1.75;

var Player = function (name, world, conn, controls) {
    var self = this;

    var velocityY = 0;

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1024);
    camera.position.z = 100.5;
    camera.position.y = CHUNK_HEIGHT / 2;

    var inventory = new Inventory(world, camera);
    controls.on('mousedown', function () {
        inventory.leftClick();
    });

    var sin = Math.sin;
    var cos = Math.cos;
    var abs = Math.abs;

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

    conn.on('player-position', function (payload) {
        var p = payload.pos;
        camera.position.set(p.x, p.y, p.z);
        var r = payload.rot;
        camera.rotation.set(r.x, r.y, r.z);
    });

    function setupBox() {
        var pos = boxCenter(camera);
        var halfExtents = new THREE.Vector3(
            0.2,
            PLAYER_HEIGHT / 2,
            0.2
        );
        return new Box(world, pos, halfExtents);
    }

    function boxCenter(camera) {
        var pos = camera.position.clone();
        var above = PLAYER_HEIGHT - PLAYER_EYE_HEIGHT;
        pos.y -= PLAYER_EYE_HEIGHT/2 + above/2;
        return pos;
    }

    function cameraPos(center) {
        var pos = center.clone();
        var above = PLAYER_HEIGHT - PLAYER_EYE_HEIGHT;
        pos.y += PLAYER_EYE_HEIGHT/2 + above/2;
        return pos;
    }

    function round(n, digits) {
        var factor = Math.pow(10, digits);
        return Math.round(n * factor) / factor;
    }

    function calcMove(dt, c) {
        var v = 10;
        var fw = dt*v*(c.moveForward ? 1 : c.moveBack ? -1 : 0);
        var rt = dt*v*(c.moveRight ? 1 : c.moveLeft ? -1 : 0);
        var move = {
            x: -cos(c.lon) * fw + sin(c.lon) * rt,
            y: velocityY * dt,
            z: -sin(c.lon) * fw - cos(c.lon) * rt,
        };
        return move;
    }

    function doLook(camera, p, c) {
        var target = new THREE.Vector3();
        target.x = p.x + sin(c.lat) * cos(c.lon);
        target.y = p.y + cos(c.lat);
        target.z = p.z + sin(c.lat) * sin(c.lon);
        camera.lookAt(target);
    }

    var accumulatedTime = 0;
    var box = setupBox();
    self.update = function (dt) {
        var c = controls.sample();
        var p = camera.position;
        var r = camera.rotation;
        var onGround = box.onGround();

        doLook(camera, p, c);

        if (c.jump && onGround) {
            velocityY = 6;
        } else if (onGround) {
            velocityY = 0;
        } else {
            velocityY += dt * -9.81;
        }

        var move = calcMove(dt, c);

        box.setPos(boxCenter(camera));
        var newPos = box.attemptMove(move);
        if (abs(p.y - newPos.y) < 0.0001) {
            velocityY = 0;
        }
        camera.position = cameraPos(newPos);

        var info = document.getElementById('info');
        if (info) {
            info.innerHTML = JSON.stringify({
                x: round(p.x, 2),
                y: round(p.y, 2),
                z: round(p.z, 2),
                g: onGround,
            });
        }

        accumulatedTime += dt;
        if (accumulatedTime > 0.1) {
            accumulatedTime -= 0.1;
            if (accumulatedTime > 1) {
                console.warn("Having trouble keeping up with minimum update speed of 10fps! (", accumulatedTime, " seconds behind). Trouble ahead...");
                accumulatedTime = 0;
            }
            conn.queue('player-position', {
                pos: {x: p.x, y: p.y, z: p.z},
                rot: {x: r.x, y: r.y, z: r.z},
            });
        }
        inventory.update(c);
    };

    self.render = function (renderer, scene) {
        renderer.render(scene, camera);
    };
};
