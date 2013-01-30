(function () {
    var container, stats;

    var scene
    var renderer;
    container = document.getElementById('container');

    var mesh;

    var clock = new THREE.Clock();
    var world;
    var player;

    function init() {
        scene = new THREE.Scene();
        world = new World(scene);
        world.loadChunk(0, 0, 0);
        world.loadChunk(-1, 0, 0);
        world.loadChunk(0, 0, -1);
        world.loadChunk(-1, 0, -1);
        
        var position = {};
        position.y = world.y(0, 0, 0) + 2;
        position.x = 0;
        position.z = 0;
        
        player = new Player(position, world, container);
        
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
        player.resize();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function minMag(a, b) {
        return Math.abs(a) < Math.abs(b) ? a : b;
    }
    
    function animate() {
        requestAnimationFrame(animate);
        
        var dt = clock.getDelta();
        player.update(dt);
        player.render(renderer, scene);
        stats.update();
    }
    
    init();
    animate();
}());