var Player = function (world, container, conn) {
    var self = this;

    var height = 1.6;
    var velocityY = 0;

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200);
    camera.position.z = 100;

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
        var p = payload.pos;
        camera.position.set(p.x, p.y, p.z);
        var r = payload.rot;
        camera.rotation.set(r.x, r.y, r.z);
    });

    function solid(x, y, z) {
        var block = world.blockAt(x, y, z);
        if (!block) return true;
        else return block.solid();
    }

    function inSolid(bbox) {
        var b = bbox;
        var s = solid;
        return s(b.xs, b.ys, b.zs) ||
            s(b.xs, b.ys, b.ze) ||
            s(b.xs, b.ye, b.zs) ||
            s(b.xs, b.ye, b.ze) ||
            s(b.xe, b.ys, b.zs) ||
            s(b.xe, b.ys, b.ze) ||
            s(b.xe, b.ye, b.zs) ||
            s(b.xe, b.ye, b.ze);
    }

    function groundHeight(bbox) {
        var cg = world.findClosestGround;
        var h = height;
        return Math.max(cg(bbox.xs, bbox.ys, bbox.zs) + h,
                        cg(bbox.xs, bbox.ys, bbox.ze) + h,
                        cg(bbox.xe, bbox.ys, bbox.zs) + h,
                        cg(bbox.xe, bbox.ys, bbox.ze) + h);
    }

    var onGround = true;
    function attemptMove(move) {
        var p = camera.position;
        var pad = 0.2;
        var bbox = {
            xs: p.x - pad,
            xe: p.x + pad,
            ys: p.y - height,
            ye: p.y + pad,
            zs: p.z - pad,
            ze: p.z + pad,
        };
        var gh = groundHeight(bbox);

        if (p.y - gh < 0) {
            p.y = gh;
            return;
        } else if (Math.abs(p.y - gh) < 0.2) {
            onGround = true;
        } else {
            onGround = false;
        }

        if (move.x) {
            bbox.xs += move.x;
            bbox.xe += move.x;
            if (!inSolid(bbox)) {
                p.x += move.x;
            } else {
                bbox.xs -= move.x;
                bbox.xe -= move.x;
            }
        }

        if (move.y) {
            bbox.ys += move.y;
            bbox.ye += move.y;
            if (!inSolid(bbox)) {
                p.y += move.y;
            } else {
                bbox.ys -= move.y;
                bbox.ye -= move.y;
            }
        }

        if (move.z) {
            bbox.zs += move.z;
            bbox.ze += move.z;
            if (!inSolid(bbox)) {
                p.z += move.z;
            } else {
                bbox.zs -= move.z;
                bbox.ze -= move.z;
            }
        }

        var info = document.getElementById('info');
        info.innerHTML = JSON.stringify({
            x: round(p.x, 2),
            y: round(p.y, 2),
            z: round(p.z, 2),
            g: onGround,
        });
    }

    function round(n, digits) {
        var factor = Math.pow(10, digits);
        return Math.round(n * factor) / factor;
    }

    var accumulatedTime = 0;
    self.update = function (dt) {
        var c = controls.update();
        var p = camera.position;
        var r = camera.rotation;

        if (c.jumping && onGround) {
            velocityY = 6;
            onGround = false;
        } else if (onGround) {
            velocityY = 0;
        } else {
            velocityY += dt * -9.81;
        }

        var fw = dt * 10 * (c.forward ? 1 : c.back ? -1 : 0);
        var rt = dt * 10 * (c.right ? 1 : c.left ? -1 : 0);
        var sin = Math.sin;
        var cos = Math.cos;
        var move = {
            x: -cos(c.lon) * fw + sin(c.lon) * rt,
            y: velocityY * dt,
            z: -sin(c.lon) * fw - cos(c.lon) * rt,
        };

        attemptMove(move);

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
