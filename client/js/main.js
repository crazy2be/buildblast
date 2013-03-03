// This variable exists only so we can test running things
// on world from the console. Code should never use this!
var WORLD;
window.onload = function () {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        document.querySelector('#container').innerHTML = "";
        return;
    }

    var container = document.getElementById('container');
    var clock = new THREE.Clock();
    var scene = new THREE.Scene();
    var conn = new Conn();
    var world = new World(scene, conn, container);
    var entityHandler = new EntityHandler(scene, conn);
    WORLD = world;

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    container.querySelector('.loader').innerHTML = "";
    container.appendChild(renderer.domElement);

    var stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);

    animate();

    function onWindowResize() {
        world.resize();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        var dt = clock.getDelta();
        world.update(dt);
        world.render(renderer, scene);
        stats.update();
    }
};
