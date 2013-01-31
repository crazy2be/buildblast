var Player = function (position, world, container) {
    var height = 1.6;
    var velocityY = 0;
    
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200);
    camera.position.y = position.y;
    camera.position.x = position.x;
    camera.position.z = position.z;
        
    var controls = new THREE.FirstPersonControls(camera, container);
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.125;
    controls.lookVertical = true;
    controls.constrainVertical = true;
    controls.heightSpeed = 1;
    
    this.getHeight = function () {
        return height;
    };
    
    this.resize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        controls.handleResize();
    };
    
    this.update = function (dt) {
        controls.update(dt);
        
        var p = camera.position;
        var y = world.findClosestGround(p.x, p.y, p.z) + 2;
        
        if (p.y < y) {
            camera.translateY(y - p.y);
            velocityY = 0;
        }
        
        if (controls.isJumping()) {
            velocityY = 0.5;
            controls.jumped();
        }
        camera.translateY(Math.max(y - p.y, velocityY));
        velocityY += dt * 0.2 * -9.81;
    };
    
    this.render = function (renderer, scene) {
        renderer.render(scene, camera);
    };
};