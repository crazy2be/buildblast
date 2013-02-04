var Player = function (position, world, container) {
    var height = 1.6;
    var velocityY = 0;
    
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200);
    camera.position.y = position.y;
    camera.position.x = position.x;
    camera.position.z = position.z;
        
    var controls = new FirstPersonControls(world, camera, container);
    
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
        var y = world.findClosestGround(p.x, p.y, p.z) + height;
        
        if (p.y < y) {
            p.y = y;
            velocityY = 0;
        } else {
            velocityY += dt * 0.005 * -9.81;   
        }
        
        if (controls.isJumping()) {
            velocityY = 0.04;
            controls.jumped();
        }
        p.y += Math.max(y - p.y, velocityY);
    };
    
    this.render = function (renderer, scene) {
        renderer.render(scene, camera);
    };
};