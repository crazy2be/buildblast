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
            var point = world.findTargetIntersection(camera).p;
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
    
    var selectElm = document.getElementById('selection');
    function select(item) {
        var html = ''
        if (item == 'gun') {
            html = '<span class="selected">gun</span><span class="notSelected">shovel</span>';
        } else if (item == 'shovel') {
            html = '<span class="notSelected">gun</span><span class="selected">shovel</span>';
        } else {
            html = '????? ' + item + ' ?????'
        }
        selectedItem = item;
        selectElm.innerHTML = html;
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
        var p = camera.position;
        var headCam;
        var headP;
        var footCam;
        var footP;
        var ds = dt * movementSpeed;
        var pad = 0.2;
        var head;
        var foot;
        var result;
        
        lon += movementX * lookSpeed;
        lat -= movementY * lookSpeed;
        lat = clamp(lat, -Math.PI + 0.01, -0.01);
        movementX = 0;
        movementY = 0;
        
        target.x = p.x + Math.sin(lat) * Math.cos(lon);
        target.y = p.y + Math.cos(lat);
        target.z = p.z + Math.sin(lat) * Math.sin(lon);
        camera.lookAt(target);
        
        headCam = camera.clone();
        headP = headCam.position;
        
        target.x = headP.x + Math.sin(-1/2 * Math.PI) * Math.cos(lon);
        target.y = headP.y + Math.cos(-1/2 * Math.PI);
        target.z = headP.z + Math.sin(-1/2 * Math.PI) * Math.sin(lon);
        headCam.lookAt(target);
        
        footCam = headCam.clone();
        footP = footCam.position;
        footP.y -= 1.1;
        
        target.x = 0;
        target.y = 0;
        target.z = 0;
        if (movingForward) {
            target.z--;
        }
        if (movingBack) {
            target.z++;
        }
        if (movingLeft) {
            target.x--;
        }
        if (movingRight) {
            target.x++;
        }
        headCam.translate(ds, target);
        
        var ray = new THREE.Raycaster(p, new THREE.Vector3(headP.x, headP.y, headP.z).sub(p).normalize());
        head = world.intersectRay(ray);
        ray = new THREE.Raycaster(footP, new THREE.Vector3(headP.x, headP.y - 1.1, headP.z).sub(footP).normalize());
        foot = world.intersectRay(ray);
        if (head.d == null && foot.d == null) result = null;
        else if (head.d == null && foot.d != null) result = foot.d;
        else if (foot.d == null && head.d != null) result = head.d;
        else result = Math.min(head.d, foot.d);
        
        if (result && result >= 0) result -= pad;

        if (result == null || ds < result) {
            camera.position = headCam.position;
        }
        
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
