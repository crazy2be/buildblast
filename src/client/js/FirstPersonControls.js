function FirstPersonControls(world, camera, element) {
    var self = this;
    
    var target = new THREE.Vector3(0, 0, 0);

    var movementSpeed = 10;
    var lookSpeed = 0.1;

    var movementX = 0;
    var movementY = 0;

    var lat = -1/2 * Math.PI;
    var lon = -3/4 * Math.PI;

    var movingForward = false;
    var movingBack = false;
    var movingLeft = false;
    var movingRight = false;
    
    var jumping = { pressed : false, released : true };

    var viewHalfX = 0;
    var viewHalfY = 0;
    
    var selectedItem = 'gun';
    
    self.isJumping = function () {
        return jumping.pressed;
    };
    
    self.jumped = function () {
        jumping.pressed = false;
    };

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
        
        if (selectedItem == 'gun') {
            var point = world.findWorldIntersection(camera);
            if (point) world.addSmallCube(point);
        } else if (selectedItem == 'shovel') {
            world.removeLookedAtBlock(camera);
        } else {
            throw "Not sure what to do with the currently selected item: '" + selectedItem + "'";
        }
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
    
    function select(item) {
        selectedItem = item;
    }
    
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
            case 188: /*comma*/
            case 38: /*up*/
            case 87: /*W*/ movingForward = true; break;

            case 37: /*left*/
            case 65: /*A*/ movingLeft = true; break;

            case 79: /*O*/
            case 40: /*down*/
            case 83: /*S*/ movingBack = true; break;

            case 69: /*E*/
            case 39: /*right*/
            case 68: /*D*/ movingRight = true; break;
            
            case 32: /*space*/
                if (jumping.released) {
                    jumping.pressed = true;
                    jumping.released = false;
                }
                break;
            case 49: /*1*/
            case 55: // 1 on prgmr dvorak
                select('gun');
                break;
            case 50: /*2*/
            case 219: // 2 on prgmr dvorak
                select('shovel');
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
            
            case 32: /*space*/ jumping.released = true; break;
        }
    };

    function clamp(n, a, b) {
        return Math.max(a, Math.min(b, n));
    }
    var info = document.getElementById('info');
    self.update = function(dt) {
        var ds = dt * movementSpeed;
        var p = camera.position;

        function dirt(p) {
            return world.blockAt(p.x, p.y, p.z).isType(Block.DIRT);
        }
        if (movingForward) {
            camera.translateZ(-ds);
            if (dirt(p)) {
                camera.translateZ(ds);
            }
        }
        if (movingBack) {
            camera.translateZ(ds);
            if (dirt(p)) {
                camera.translateZ(-ds);
            }
        }
            
        
        if (movingLeft) {
            camera.translateX(-ds);
            if (dirt(p)) {
                camera.translateX(ds);
            }
        }
        if (movingRight) {
            camera.translateX(ds);
            if (dirt(p)) {
                camera.translateX(-ds);
            }
        }
        
        
        lon += movementX * dt * lookSpeed;
        lat -= movementY * dt * lookSpeed;
        lat = clamp(lat, -Math.PI + 0.01, -0.01);
        movementX = 0;
        movementY = 0;
        
        target.x = p.x + Math.sin(lat) * Math.cos(lon);
        target.y = p.y + Math.cos(lat);
        target.z = p.z + Math.sin(lat) * Math.sin(lon);
        camera.lookAt(target);
        
        
        info.innerHTML = JSON.stringify({
            x: round(p.x, 2),
            y: round(p.y, 2),
            z: round(p.z, 2)
        });
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
    
    function round(n, digits) {
        var factor = Math.pow(10, digits);
        return Math.round(n * factor) / factor;
    }

    self.handleResize();
};
