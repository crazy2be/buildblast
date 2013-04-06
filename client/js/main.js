window.onload = function () {
    var container = document.getElementById('container');
    var tester = new FeatureTester();
    tester.run();
    if (!tester.pass()) {
        container.innerHeight = '';
        container.appendChild(tester.errors());
        return;
    }

    Models.init(startGame);

    function startGame() {
        var scene = new THREE.Scene();
        var clock = new THREE.Clock();
        var world = new World(scene, container);
        world.resize();

        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        container.querySelector('#loader').innerHTML = "";
        container.querySelector('#opengl').appendChild(renderer.domElement);

        var stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.right = '0px';
        container.appendChild(stats.domElement);

        window.addEventListener('resize', onWindowResize, false);

        animate();

        function onWindowResize() {
            world.resize();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            var dt = clock.getDelta();
            world.update(dt);
            world.render(renderer, scene);
            stats.update();

            requestAnimationFrame(animate);
        }
    }
};

window.onerror = function (msg, url, lineno) {
    fatalError({
        message: msg,
        filename: url,
        lineno: lineno,
    });
};

function fatalError(err) {
    var st = document.getElementById("fatal-error");
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

var sin = Math.sin;
var cos = Math.cos;
var abs = Math.abs;
var min = Math.min;
var max = Math.max;
var sqrt = Math.sqrt;
var pow = Math.pow;
