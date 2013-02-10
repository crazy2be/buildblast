function FirstPersonControls(world, camera, element) {
    var self = this;

    var target = new THREE.Vector3(0, 0, 0);

    var movementSpeed = 10;
    var lookSpeed = 0.005;

    var movementX = 0;
    var movementY = 0;

    var lat = -1/2 * Math.PI;
    var lon = -3/4 * Math.PI;

    var movingForward = false;
    var movingBack = false;
    var movingLeft = false;
    var movingRight = false;
    var jumping = false;

    var viewHalfX = 0;
    var viewHalfY = 0;

    var inventory = new Inventory(world, camera);

    self.handleResize = function () {
        viewHalfX = element.offsetWidth / 2;
        viewHalfY = element.offsetHeight / 2;
    };

    var havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;

    if (havePointerLock) {
        element.requestPointerLock = element.requestPointerLock ||
                element.mozRequestPointerLock ||
                element.webkitRequestPointerLock;
    } else {
        alert("You should probably use the latest Chrome or Firefox. Pointer lock is required");
    }

    function mouseDown(event) {
        element.focus();

        event.preventDefault();
        event.stopPropagation();

        element.requestPointerLock();

        // I'm actually lying, we always call this.
        // but we will call different ones soon.
        inventory.leftClick();
    };

    function mouseUp(event) {
        event.preventDefault();
        event.stopPropagation();
        // TODO: Add use for this?
    };

    function mouseMove(event) {
        movementX += event.movementX ||
                event.mozMovementX        ||
                event.webkitMovementX     ||
                0;
        movementY += event.movementY ||
                event.mozMovementY        ||
                event.webkitMovementY     ||
                0;
    };

    function pointerLockChange() {
        if (document.pointerLockElement === element ||
                document.mozPointerLockElement === element ||
                document.webkitPointerLockElement === element) {
            // Pointer was just locked, enable the mousemove listener
            element.addEventListener('mousemove', mouseMove, false);
        } else {
            // Pointer was just unlocked, disable the mousemove listener
            element.removeEventListener('mousemove', mouseMove, false);
        }
    };

    function keyDown(event) {
        switch (event.keyCode) {
            case 188: // comma
            case 38:  // up
            case 87:  // W
                movingForward = true;
                break;

            case 37: // left
            case 65: // A
                movingLeft = true;
                break;

            case 79: // O
            case 40: // down
            case 83: // S
                movingBack = true;
                break;

            case 69: // E
            case 39: // right
            case 68: // D
                movingRight = true;
                break;

            case 32: // space
                jumping = true;
                break;

            case 49: // 1
            case 55: // 1 on prgmr dvorak
                inventory.selectSlot(0);
                break;
            case 50: // 2
            case 219: // 2 on prgmr dvorak
                inventory.selectSlot(1);
                break;
            case 51: // 3
            case 221: // 4 on prgmr dvorak (3 doesn't work)
                inventory.selectSlot(2);
                break;

            default:
                console.log("Warning: Unrecognized keyCode: " + event.keyCode);
        }
    };

    function keyUp(event) {
        switch(event.keyCode) {
            case 188: /*comma*/
            case 38: /*up*/
            case 87: /*W*/ movingForward = false; break;

            case 37: /*left*/
            case 65: /*A*/ movingLeft = false; break;

            case 79: /*O*/
            case 40: /*down*/
            case 83: /*S*/ movingBack = false; break;

            case 69: /*E*/
            case 39: /*right*/
            case 68: /*D*/ movingRight = false; break;

            case 32: /*space*/ jumping = false; break;
        }
    };

    function clamp(n, a, b) {
        return Math.max(a, Math.min(b, n));
    }

    self.update = function(dt) {
        lon += movementX * lookSpeed;
        lat -= movementY * lookSpeed;
        lat = clamp(lat, -Math.PI + 0.01, -0.01);
        movementX = 0;
        movementY = 0;

        var target = new THREE.Vector3();
        var p = camera.position;
        target.x = p.x + Math.sin(lat) * Math.cos(lon);
        target.y = p.y + Math.cos(lat);
        target.z = p.z + Math.sin(lat) * Math.sin(lon);
        camera.lookAt(target);

        return {
            forward: movingForward,
            back: movingBack,
            left: movingLeft,
            right: movingRight,
            jumping: jumping,
            lat: lat,
            lon: lon,
        }
    };

    document.addEventListener('pointerlockchange', pointerLockChange, false);
    document.addEventListener('mozpointerlockchange', pointerLockChange, false);
    document.addEventListener('webkitpointerlockchange', pointerLockChange, false);

    element.tabIndex = "-1";
    element.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false);
    element.addEventListener('mousedown', mouseDown, false);
    element.addEventListener('mouseup', mouseUp, false);
    element.addEventListener('keydown', keyDown, false);
    element.addEventListener('keyup', keyUp, false);

    self.handleResize();
};
