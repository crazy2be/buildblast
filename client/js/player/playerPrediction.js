function PlayerPrediction(world, conn, position) {
    var self = this;

    var clock = new Clock(conn);

    self.update = function (controls) {
        sendControlsToNetwork(controls);
        return applyRemainingClientPredictions();
    }

    var timeOffset = Date.now();
    function sendControlsToNetwork(c) {
        var userCommand = {
            Controls: c,
            Timestamp: clock.time(),
        };
        conn.queue('controls-state', userCommand);
        userCommands.push(userCommand);
    }

    var lastConfirmedPrediction = {
        Pos: new THREE.Vector3(0.0, 0.0, 0.0),
        Timestamp: 0.0,
        VelocityY: 0.0,
        Hp: 100,
    };
    var userCommands = [];
    conn.on('player-state', function (payload) {
        var cmd = userCommands.shift();
        if (cmd.Timestamp !== payload.Timestamp) {
            // We should probably handle this more gracefully.
            throw "Recieved player-position packet from server with timestamp that does not match our oldest non-confirmed packet. This means the server is either processing packets out of order, or dropped one.";
        }
        var prevhp = lastConfirmedPrediction.Hp;
        var p = payload.Pos;
        payload.Pos = new THREE.Vector3(p.X, p.Y, p.Z);
        lastConfirmedPrediction = payload;

        var hp = payload.Hp;
        if (hp === prevhp) return;

        var health = document.getElementById('health-value');
        if (!health) return;

        health.style.width = hp + '%';
        if (hp < 25) {
            health.classList.add('critical');
        } else if (hp < 50) {
            health.classList.add('low');
        } else {
            health.classList.remove('critical');
            health.classList.remove('low');
        }

        // Force animations to restart
        var newHealth = health.cloneNode(true);
        health.parentNode.replaceChild(newHealth, health);
    });

    function applyRemainingClientPredictions() {
        var confirmed = lastConfirmedPrediction;
        var pos = confirmed.Pos.clone();
        var vy = confirmed.VelocityY;
        var t = confirmed.Timestamp;
        for (var i = 0; i < userCommands.length; i++) {
            var uc = userCommands[i];
            var c = uc.Controls;
            var dt = (uc.Timestamp - t) / 1000;
            if (dt > 1.0) {
                console.warn("WARN: Attempting to simulate step with dt of ", dt, " which is too large. Clipping to 1.0s");
                dt = 1.0;
            }
            t = uc.Timestamp;
            vy = applyUserCommand(pos, c, vy, dt);
        }

        var lag = (userCommands[userCommands.length - 1].Timestamp - confirmed.Timestamp) / 1000;
        if (lag > 1.0) {
            console.warn("Heavy lag! Corrections may be painful... (", lag, " seconds since last server confirmation)");
        }

        updatePositionText(pos, vy);
        return pos;
    }

    var box = new Box(position, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);
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

        box.setPos(pos);
        box.attemptMove(world, move);
        if (move.y === 0) {
            vy = c.jump ? 6 : 0;
        }
        return vy;
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
}
