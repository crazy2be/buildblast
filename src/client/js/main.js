(function () {
    var container, stats;

    var camera, controls, scene, renderer;
    container = document.getElementById('container');

    var mesh;

    var clock = new THREE.Clock();
    var world;

    function init() {
        
        scene = new THREE.Scene();
        world = new World(scene);
        world.loadChunk(0, 0);
        world.loadChunk(-1, 0);
        world.loadChunk(0, -1);
        world.loadChunk(-1, -1);
        
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200);
        camera.position.y = world.y(0, 0) + 2;
        camera.position.x = 0;
        camera.position.z = 0;
        
        controls = new THREE.FirstPersonControls(camera, container);
        
        controls.movementSpeed = 10;
        controls.lookSpeed = 0.125;
        controls.lookVertical = true;
        controls.constrainVertical = true;
        controls.heightSpeed = 1;
        
        var ambientLight = new THREE.AmbientLight(0xcccccc);
        scene.add(ambientLight);
        
        var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(1, 1, 0.5).normalize();
        scene.add(directionalLight);
        
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        container.innerHTML = "";
        
        container.appendChild(renderer.domElement);
        
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild(stats.domElement);
        
        window.addEventListener('resize', onWindowResize, false);
        
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        controls.handleResize();
    }
    
    container.addEventListener('keydown', function (ev) {
        if (ev.keyCode == 32) {
            playerV = 3;
        }
    }, false);
    
    function minMag(a, b) {
        return Math.abs(a) < Math.abs(b) ? a : b;
    }
    var playerV = 0;
    function animate() {
        requestAnimationFrame(animate);
        
        var dt = clock.getDelta();
        controls.update(dt);
        
        var p = camera.position;
        var y = world.y(p.x, p.z) + 2;
        if (p.y < y) {
            camera.translateY(y - p.y);
            playerV = 0;
        } else {
            camera.translateY(Math.max(y - p.y, playerV));
            playerV += dt * -9.81;
        }
        
        renderer.render(scene, camera);
        stats.update();
    }
    
    init();
    animate();
}());