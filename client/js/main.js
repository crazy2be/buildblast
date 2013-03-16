window.onload = function () {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        document.querySelector('#container').innerHTML = "";
        return;
    }

    var container = document.getElementById('container');
    var clock = new THREE.Clock();
    var scene = new THREE.Scene();
    var world = new World(scene, container);

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

function fatalError(err) {
    var st = document.getElementById("connection-status");
    st.innerHTML = ["<tr><td>",
        "<h1>Fatal Error!</h1>",
        "<p>",
            err.filename || err.fileName,
            " (",
                err.lineno || err.lineNumber,
            "):",
        "</p>",
        "<p>",
            err.message,
        "</p>",
        "<p>Press F5 to attempt a rejoin</p>",
        "</td></tr>"].join("\n");
}
