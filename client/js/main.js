// This variable exists only so we can test running things
// on world from the console. Code should never use this!
var WORLD;
window.onload = function () {
    THREE.PerspectiveCamera.prototype.clone = function () {
        var newCam = new THREE.Camera();
        newCam.matrixWorldInverse = this.matrixWorldInverse.clone();
        newCam.projectionMatrix = this.projectionMatrix.clone();
        newCam.projectionMatrixInverse = this.projectionMatrixInverse.clone();
        newCam.position = this.position.clone();
        return newCam;
    }

    THREE.Camera.prototype.clone = function () {
        var newCam = new THREE.Camera();
        newCam.matrixWorldInverse = this.matrixWorldInverse.clone();
        newCam.projectionMatrix = this.projectionMatrix.clone();
        newCam.projectionMatrixInverse = this.projectionMatrixInverse.clone();
        newCam.position = this.position.clone();
        return newCam;
    }

    var container = document.getElementById('container');
    var clock = new THREE.Clock();
    var scene = new THREE.Scene();
    var conn = new Conn();
    var world = new World(scene, conn);
    var entityHandler = new EntityHandler(scene, conn);
    WORLD = world;

    var player = new Player(world, container, conn);

    var ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 0.5).normalize();
    scene.add(directionalLight);

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
        player.resize();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        var dt = clock.getDelta();
        player.update(dt);
        player.render(renderer, scene);
        stats.update();
    }
};
