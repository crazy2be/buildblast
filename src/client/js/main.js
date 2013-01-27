(function () {
    var container, stats;

    var camera, controls, scene, renderer;

    var mesh;

    var clock = new THREE.Clock();

    function init() {
        container = document.getElementById('container');
        
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200);
        camera.position.y = getWorldY(0, 0) + 2;
        
        controls = new THREE.FirstPersonControls(camera, container);
        
        controls.movementSpeed = 10;
        controls.lookSpeed = 0.125;
        controls.lookVertical = true;
        controls.constrainVertical = true;
        controls.heightSpeed = 1;
        
        scene = new THREE.Scene();
        
		var mesh = world.generateMesh();
        scene.add(mesh);
        
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

    function generateHeight(width, height) {
        var data = [];
        var perlin = new ImprovedNoise();
        var size = width * height;
        var quality = 2;
        var z = Math.random() * 100;
        
        for (var i = 0; i < size; i++) {
            data[i] = 0;
        }
        
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < size; j++) {
                var x = j % width
                var y = (j / width) | 0;
                
                data[j] += perlin.noise(x / quality, y / quality, z) * quality;
            }
            quality *= 4
        }
        return data;
    }
    
    var data = generateHeight(64, 64);
	var world = new World(data);
    
    function getWorldY(x, z) {
        var gx = (x + 32) | 0;
        var gz = (z + 32) | 0;
        var gy = world.y(gx, gz);
        return gy;
    }

    function minMag(a, b) {
        return Math.abs(a) < Math.abs(b) ? a : b;
    }
    var playerV = 0;
    function animate() {
        requestAnimationFrame(animate);
        
        var dt = clock.getDelta();
        controls.update(dt);
        
        var p = camera.position;
        var y = getWorldY(p.x, p.z) + 2;
        if (p.y < y) {
            camera.translateY(y - p.y);
            playerV = 0;
        } else {
            camera.translateY(minMag(y - p.y, playerV));
            playerV += dt * -9.81;
        }
        
        renderer.render(scene, camera);
        stats.update();
    }
    
    init();
	animate();
}());