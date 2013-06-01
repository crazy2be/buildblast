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

        chat: [Keys.Enter],

        activateBuilder: [MouseButtons.Left],
        activateBlaster: [MouseButtons.Right],
    };

    var ActionMappingsQwerty = {
        forward: [Keys.W],
        left: [Keys.A],
        right: [Keys.D],
        back: [Keys.S],

        nextBuilder: [Keys.Q],
        nextBlaster: [Keys.E],
    };

    var ActionMappingsDvorak = {
        forward: [Keys.Comma],
        left: [Keys.A],
        right: [Keys.E],
        back: [Keys.O],

        nextBuilder: [Keys.Semicolon],
        nextBlaster: [Keys.Period],
    };

    var mapping;
    if (window.localStorage["useDvorak"]) {
        mapping = mergeMappings(ActionMappingsBase, ActionMappingsDvorak);
    } else {
        mapping = mergeMappings(ActionMappingsBase, ActionMappingsQwerty);
    }

    var self = this;

    var actions = {
        lat: -1/2 * Math.PI,
        lon: 1/2 * Math.PI,
        // Actions are added here as keys are pressed
    };

    self.sample = function() {
        return clone(actions);
    };

    function findAction(trigger) {
        for (var action in mapping) {
            var triggers = mapping[action];
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

    // is this running in a touch capable environment?
    var touchable = 'createTouch' in document;

    // array of touch vectors
    var touches = [];

    var $canvas = $("#touchLayer");
    var pen = $canvas[0].getContext('2d');
    var halfWidth = 0;

    elm.tabIndex = "-1";
    elm.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false);

    if (touchable) {
        elm.addEventListener('touchstart', onTouchStart, false);
        elm.addEventListener('touchmove', onTouchMove, false);
        elm.addEventListener('touchend', onTouchEnd, false);

        elm.classList.add('interactive');

        window.onorientationchange = function() {
            $canvas.attr("width", window.innerWidth + "px");
            $canvas.attr("height", window.innerHeight + "px");
            halfWidth = $canvas.width() / 2;
        };
        window.onorientationchange();
    } else {
        onPointerLock(pointerLockChange);
        elm.addEventListener('mousedown', mouseDown, false);
        elm.addEventListener('mouseup', mouseUp, false);
        elm.addEventListener('keydown', keyDown, false);
        elm.addEventListener('keyup', keyUp, false);
    }

    function attemptPointerLock() {
        if (pointerLocked()) return;

        // We had an error :(
        if (elm.classList.contains('error')) return;

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
            elm.classList.add('interactive');
        } else {
            // Pointer was just unlocked, disable the mousemove listener
            elm.removeEventListener('mousemove', mouseMove, false);
            elm.classList.remove('interactive');
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

    /** Touch control interface */

    // Variables for tracking finger locations
    var leftTouchID = -1,
        leftTouchPos = [0, 0],
        leftTouchStartPos = [0, 0],
        leftVector = [0, 0],
        rightTouchID = -1,
        rightTouchPos = [0, 0],
        rightTouchStartPos = [0, 0],
        rightVector = [0, 0];

    function onTouchStart(e) {
        e.preventDefault();
        touchStartTime = Date.now();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            if ((leftTouchID < 0) && (touch.pageX < halfWidth)) {
                leftTouchID = touch.identifier;
                leftTouchStartPos = [touch.pageX, touch.pageY];
                leftTouchPos = [touch.pageX, touch.pageY];
                leftVector = [0, 0];
            } else if ((rightTouchID < 0) && (touch.pageX >= halfWidth)) {
                rightTouchID = touch.identifier;
                rightTouchStartPos = [touch.pageX, touch.pageY];
                rightTouchPos = [touch.pageX, touch.pageY];
                rightVector = [0, 0];
            }
        }
        touches = e.touches;
    }

    function onTouchMove(e) {
       // Prevent the browser from doing its default thing (scroll, zoom)
       e.preventDefault();
       for (var i = 0; i < e.changedTouches.length; i++) {
           var touch = e.changedTouches[i];
           if (leftTouchID == touch.identifier) {
               leftTouchPos = [touch.pageX, touch.pageY];
               leftVector = [touch.pageX - leftTouchStartPos[0],
                             touch.pageY - leftTouchStartPos[1]];
           } else if (rightTouchID == touch.identifier) {
               rightTouchPos = [touch.pageX, touch.pageY];
               rightVector = [touch.pageX - rightTouchStartPos[0],
                             touch.pageY - rightTouchStartPos[1]];
           }
       }
       touches = e.touches;
    }

    function onTouchEnd(e) {
        touches = e.touches;
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            if (leftTouchID == touch.identifier) {
                leftTouchID = -1;
                leftVector = [0, 0];
            } else if (rightTouchID == touch.identifier) {
                rightTouchID = -1;
                rightVector = [0, 0];
            }
        }
    }

    self.update = function(dt) {
        function clamp(n, a, b) {
            return max(a, min(b, n));
        }

        var maxRange = 50;
        var lookSpeedX = 0.05 * max(rightVector[0], maxRange) / maxRange;
        var lookSpeedY = 0.05 * max(rightVector[1], maxRange) / maxRange;

        var lon = 0;
        var lat = 0;

        if (abs(rightVector[0]) > 10) {
            if (rightVector[0] < 0) {
                lon = max(rightVector[0], -maxRange);
            } else {
                lon = min(rightVector[0], maxRange);
            }
        }

        if (abs(rightVector[1]) > 10) {
            if (rightVector[1] < 0) {
                lat = max(rightVector[1], -maxRange);
            } else {
                lat = min(rightVector[1], maxRange);
            }
        }

        actions.lon += lon * dt * lookSpeedX;
        actions.lon %= 2 * Math.PI;
        actions.lat -= lat * dt * lookSpeedY;
        actions.lat = clamp(actions.lat, -Math.PI + 0.01, -0.01);

        // Movement
        if (sqrt(pow(leftVector[0], 2) + pow(leftVector[1], 2)) > 10) {
            var angle = atan2(leftVector[1], leftVector[0]) * 180 / Math.PI;
            angle = (angle + 360) % 360;
            var W = 360 - 22.5 >= angle && angle >= 180 + 22.5;
            var A = 270 - 22.5 >= angle && angle >= 90 + 22.5;
            var S = 180 - 22.5 >= angle && angle >= 22.5;
            var D = 90 - 22.5 >= angle || angle >= 270 + 22.5;

            if (W) actionStart(Keys.W); else actionEnd(Keys.W);
            if (A) actionStart(Keys.A); else actionEnd(Keys.A);
            if (S) actionStart(Keys.S); else actionEnd(Keys.S);
            if (D) actionStart(Keys.D); else actionEnd(Keys.D);
        } else {
            actionEnd(Keys.W);
            actionEnd(Keys.A);
            actionEnd(Keys.S);
            actionEnd(Keys.D);
        }
    };

    self.render = function() {
        if(!touchable) {
            return;
        }
        pen.clearRect(0, 0, $canvas.width(), $canvas.height());

        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];

            if (touch.identifier == leftTouchID || touch.identifier == rightTouchID) {
                var startPos;
                var touchPos;
                if (touch.identifier == leftTouchID) {
                    startPos = leftTouchStartPos;
                    touchPos = leftTouchPos;
                } else {
                    startPos = rightTouchStartPos;
                    touchPos = rightTouchPos;
                }
                pen.beginPath();
                pen.strokeStyle = "#000080";
                pen.lineWidth = 3;
                pen.arc(startPos[0], startPos[1], 30, 0, Math.PI * 2, true);
                pen.stroke();

                pen.beginPath();
                pen.strokeStyle = "#000080";
                pen.lineWidth = 1;
                pen.arc(startPos[0], startPos[1], 20, 0, Math.PI * 2, true);
                pen.stroke();

                pen.beginPath();
                pen.strokeStyle = "#000080";
                pen.arc(touchPos[0], touchPos[1], 25, 0, Math.PI*2, true);
                pen.stroke();
            }
        }
    };
};
