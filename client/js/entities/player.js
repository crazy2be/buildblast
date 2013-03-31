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
    var weaponInventory = new WeaponInventory(world, camera);

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

    self.render = function (renderer, scene) {
        renderer.render(scene, camera);
    };

    self.update = function (dt) {
        var c = controls.sample();
        sendControlsToNetwork(c);
        sendPositionToNetwork(camera.position); // TO DO: Remove

        var p = applyRemainingClientPredictions();
        camera.position.set(p.x, p.y, p.z);

        doLook(camera, camera.position, c);
        blockInventory.update(p, c);
        weaponInventory.update(p, c);
    };

    var box = new Box(camera.position, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);
    function applyUserCommand(pos, c, vy, dt) {
        vy += dt * -9.81;

        var dist = 10 * dt;
        var fw = dist*(c.forward ? 1 : c.back ? -1 : 0);
        var rt = dist*(c.right ? 1 : c.left ? -1 : 0);
        var move = {
            x: -cos(c.lon) * fw + sin(c.lon) * rt,
            y: vy * dt,
            z: -sin(c.lon) * fw - cos(c.lon) * rt,
        };
        if (isNaN(move.y)) debugger;

        box.setPos(pos);
        box.attemptMove(world, move);
        if (move.y === 0) {
            vy = c.jump ? 6 : 0;
        }
        return vy;
    }

    function applyRemainingClientPredictions() {
        var pos = latestConfirmedPosition.Pos.clone();
        var vy = latestConfirmedPosition.VelocityY;
        var t = latestConfirmedPosition.Timestamp;
        for (var i = 0; i < userCommands.length; i++) {
            var uc = userCommands[i];
            var c = uc.Controls;
            var dt = (uc.Timestamp - t) / 1000;
            t = uc.Timestamp;
            vy = applyUserCommand(pos, c, vy, dt);
        }
        updatePositionText(pos, vy);
        return pos;
    }

    var latestConfirmedPosition = {
        Pos: new THREE.Vector3(0.0, 0.0, 0.0),
        Timestamp: 0.0,
        VelocityY: 0.0,
    };
    var userCommands = [];
    conn.on('player-position', function (payload) {
        var p = payload.Pos;
        var t = payload.Timestamp;
        var vy = payload.VelocityY;
        var cmd = userCommands.shift();
        if (cmd.Timestamp !== t) {
            // We should probably handle this more gracefully.
            throw "Recieved player-position packet from server with timestamp that does not match our oldest non-confirmed packet. This means the server is either processing packets out of order, or dropped one.";
        }
        latestConfirmedPosition.Pos.set(p.X, p.Y, p.Z);
        latestConfirmedPosition.Timestamp = t;
        latestConfirmedPosition.VelocityY = vy;
    });

    function sendControlsToNetwork(c) {
        var userCommand = {
            Controls: c,
            Timestamp: window.performance.now(),
        };
        conn.queue('controls-state', userCommand);
        userCommands.push(userCommand);
    }

    function sendPositionToNetwork(p) {
        // Still used for chunk loading. Really shouldn't be.
        // TODO: Kill this.
        conn.queue('player-position', {
            pos: {x: p.x, y: p.y, z: p.z},
        });
    }

    function doLook(camera, p, c) {
        var target = new THREE.Vector3();
        target.x = p.x + sin(c.lat) * cos(c.lon);
        target.y = p.y + cos(c.lat);
        target.z = p.z + sin(c.lat) * sin(c.lon);
        camera.lookAt(target);
    }

    function updatePositionText(p, vy) {
        var info = document.getElementById('info');
        if (!info) return;

        info.innerHTML = JSON.stringify({
            x: round(p.x, 2),
            y: round(p.y, 2),
            z: round(p.z, 2),
            v: round(vy, 2),
        });
    }

    function round(n, digits) {
        var factor = Math.pow(10, digits);
        return Math.round(n * factor) / factor;
    }
};
