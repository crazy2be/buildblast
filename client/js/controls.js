function Controls(elm) {
    // Key codes for a bunch of the keys we need. Need more
    // keys or these keycodes aren't working for you?
    // Head over to http://whatthekeycode.com/ to find out the
    // codes for the keys you want to add.
    var Keys = {
        W: 87,
        A: 65,
        S: 83,
        D: 68,

        Left: 37,
        Up: 38,
        Right: 39,
        Down: 40,

        Space: 32,

        One: 49,
        Two: 50,
        Three: 51,

        Comma: 188,

        E: 69,
        O: 79,

        Ampersand: 55,
        LeftSquareBraket: 219,
        RightCurlyBraket: 221,
    };

    var MouseButtons = {
        Left: 0,
        Middle: 1,
        Right: 2,
    }

    // We have programmer's dvorak keys in here too, because
    // so far there is no reason not to.
    var ActionMappings = {
        forward: [Keys.W, Keys.Up, Keys.Comma],
        left: [Keys.A, Keys.Left],
        right: [Keys.D, Keys.Right, Keys.E],
        back: [Keys.S, Keys.Down, Keys.O],
        jump: [Keys.Space],

        selectSlot1: [Keys.One, Keys.Ampersand],
        selectSlot2: [Keys.Two, Keys.LeftSquareBraket],
        selectSlot3: [Keys.Three, Keys.RightCurlyBraket],

        shoot: [MouseButtons.Left],
        place: [MouseButtons.Right],
    };

    var self = this;

    var actions = {
        lat: -1/2 * Math.PI,
        lon: 1/2 * Math.PI,
    };

    self.sample = function() {
        function clone(o) {
            var newO = {};
            for (var k in o) {
                newO[k] = o[k];
            }
            return newO;
        }

        return clone(actions);
    };

    function findAction(c, cb) {
        for (var action in ActionMappings) {
            var vals = ActionMappings[action]
            for (var i = 0; i < vals.length; i++) {
                if (vals[i] === c) {
                    cb(action);
                    // Right now this means only the
                    // first action is matched. Should we
                    // support matching more than one action?
                    return;
                }
            }
        }
        console.log("Warning: Unrecognized keyCode: ", c);
    }

    function keyDown(event) {
        findAction(event.keyCode, function (action) {
            actions[action] = true;
            eventBus.fire(action);
        });
    }

    function keyUp(event) {
        findAction(event.keyCode, function (action) {
            actions[action] = false;
        });
    }

    function mouseDown(event) {
        elm.focus();
        attemptPointerLock();
        if (!pointerLocked()) return;
        event.preventDefault();
        event.stopPropagation();

        findAction(event.button, function (action) {
            actions[action] = true;
            console.log(action);
            eventBus.fire(action);
        });
    }

    function mouseUp(event) {
        event.preventDefault();
        event.stopPropagation();

        findAction(event.button, function (action) {
            actions[action] = false;
        });
    }

    function mouseMove(event) {
        function clamp(n, a, b) {
            return Math.max(a, Math.min(b, n));
        }
        var lookSpeed = 0.005;

        var x = event.movementX  ||
            event.mozMovementX    ||
            event.webkitMovementX ||
            0;
        var y = event.movementY  ||
            event.mozMovementY    ||
            event.webkitMovementY ||
            0;

        actions.lon += x * lookSpeed;
        actions.lon %= 2 * Math.PI;
        actions.lat -= y * lookSpeed;
        actions.lat = clamp(actions.lat, -Math.PI + 0.01, -0.01);
    }

    var eventBus = new EventBus();
    self.on = eventBus.on;
    self.off = eventBus.off;

    onPointerLock(pointerLockChange);

    elm.tabIndex = "-1";
    elm.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false);
    elm.addEventListener('mousedown', mouseDown, false);
    elm.addEventListener('mouseup', mouseUp, false);
    elm.addEventListener('keydown', keyDown, false);
    elm.addEventListener('keyup', keyUp, false);

    function attemptPointerLock() {
        if (pointerLocked()) return;

        // Firefox currently only allows us to access
        // pointer lock if the document is in full screen.
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=737100
        if ('mozPointerLockElement' in document) {
            requestFullscreen();
        }
        requestPointerLock();
    }

    function pointerLockChange() {
        if (pointerLocked()) {
            // Pointer was just locked, enable the mousemove listener
            elm.addEventListener('mousemove', mouseMove, false);
        } else {
            // Pointer was just unlocked, disable the mousemove listener
            elm.removeEventListener('mousemove', mouseMove, false);
        }
    }

    function requestPointerLock() {
        (elm.requestPointerLock ||
        elm.mozRequestPointerLock ||
        elm.webkitRequestPointerLock).call(elm);
    }

    function requestFullscreen() {
        (elm.requestFullscreen ||
        elm.mozRequestFullscreen ||
        elm.mozRequestFullScreen || // Older API upper case 'S'.
        elm.webkitRequestFullscreen).call(elm);
    }

    function onPointerLock(cb) {
        document.addEventListener('pointerlockchange', cb, false);
        document.addEventListener('mozpointerlockchange', cb, false);
        document.addEventListener('webkitpointerlockchange', cb, false);
    }

    function pointerLocked() {
        return document.pointerLockElement === elm ||
            document.mozPointerLockElement === elm ||
            document.webkitPointerLockElement === elm;
    }
};
