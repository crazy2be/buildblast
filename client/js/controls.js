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
        Q: 81,
        E: 69,

        Left: 37,
        Up: 38,
        Right: 39,
        Down: 40,

        Space: 32,
        Enter: 13,

        One: 49,
        Two: 50,
        Three: 51,

        Comma: 188,

        E: 69,
        O: 79,
        Semicolon: 186,
        Period: 190,

        Ampersand: 55,
        LeftSquareBraket: 219,
        RightCurlyBraket: 221,
    };

    var MouseButtons = {
        Left: 0,
        Middle: 1,
        Right: 2,
    };

    var ActionMappingsBase = {
        forward: [Keys.Up],
        left: [Keys.Left],
        right: [Keys.Right],
        back: [Keys.Down],
        jump: [Keys.Space],

        activateWeapon: [MouseButtons.Left],
        activateBlock: [MouseButtons.Right],
    }

    var ActionMappingsQwerty = {
        forward: [Keys.W],
        left: [Keys.A],
        right: [Keys.D],
        back: [Keys.S],

        nextWeapon: [Keys.Q],
        nextBlock: [Keys.E],
    };

    var ActionMappingsDvorak = {
        forward: [Keys.Comma],
        left: [Keys.A],
        right: [Keys.E],
        back: [Keys.O],

        nextWeapon: [Keys.Semicolon],
        nextBlock: [Keys.Period],
    }

    if (window.localStorage["useDvorak"]) {
        var mapping = mergeMappings(ActionMappingsBase, ActionMappingsDvorak);
    } else {
        var mapping = mergeMappings(ActionMappingsBase, ActionMappingsQwerty);
    }

    var self = this;

    var actions = {
        lat: -1/2 * Math.PI,
        lon: 1/2 * Math.PI,
    };

    self.sample = function() {
        return clone(actions);
    };

    function findAction(trigger) {
        for (var action in mapping) {
            var triggers = mapping[action]
            for (var i = 0; i < triggers.length; i++) {
                if (triggers[i] === trigger) return action;
            }
        }
        console.log("Warning: Unrecognized trigger: ", trigger);
    }

    function actionStart(trigger) {
        var action = findAction(trigger);
        if (!action) return;
        actions[action] = true;
    }

    function actionEnd(trigger) {
        var action = findAction(trigger);
        if (!action) return;
        actions[action] = false;
    }

    function keyDown(event) {
        actionStart(event.keyCode);
    }

    function keyUp(event) {
        actionEnd(event.keyCode);
    }

    function mouseDown(event) {
        elm.focus();
        attemptPointerLock();
        if (!pointerLocked()) return;
        event.preventDefault();
        event.stopPropagation();

        actionStart(event.button);
    }

    function mouseUp(event) {
        event.preventDefault();
        event.stopPropagation();

        actionEnd(event.button);
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

    function mergeMappings(base, more) {
        var mappings = clone(base);
        for (var action in more) {
            if (base[action]) {
                mappings[action] = base[action].concat(more[action]);
            } else {
                mappings[action] = more[action].slice();
            }
        }
        return mappings;
    }

    function clone(o) {
        var newO = {};
        for (var k in o) {
            newO[k] = o[k];
        }
        return newO;
    }
};
