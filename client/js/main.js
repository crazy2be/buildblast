window.onload = function () {
	var container = document.getElementById('container');
	var tester = new FeatureTester();
	tester.run();
	if (!tester.pass()) {
		container.innerHeight = '';
		container.appendChild(tester.errors());
		return;
	}

	var conn = new Conn(getWSURI("main/"));
	var clock = new Clock(conn);
	var playerID;

	async.parallel([
		function (callback) {
			Models.init(callback);
		},
		function (callback) {
			conn.on('handshake-reply', function (payload) {
				console.log(payload);
				clock.init(payload.ServerTime)
				playerID = payload.ClientID;
				callback();
			});
			conn.on('handshake-error', function (payload) {
				throw payload.Message;
			});
			conn.queue('handshake-init', {
				DesiredName: localStorage.playerName,
			});
		}
	], function (err, results) {
		console.log(results);
		startGame();
	})

	function startGame() {
		var scene = new THREE.Scene();
		var world = new World(scene, conn, clock, container, playerID);
		world.resize();

		var renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);

		container.querySelector('#opengl').appendChild(renderer.domElement);
		document.querySelector('#splash h1').innerHTML = 'Click to play!';

		var speed = new PerfChart({
			title: ' render',
			maxValue: 50,
		});
		speed.elm.style.position = 'absolute';
		speed.elm.style.top = '74px';
		speed.elm.style.right = '0px';
		container.appendChild(speed.elm);

		window.addEventListener('resize', onWindowResize, false);

		animate();

		function onWindowResize() {
			world.resize();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}

		var previousTime = clock.time();
		function animate() {
			clock.update();
			var newTime = clock.time();
			var dt = newTime - previousTime;
			previousTime = newTime;
			world.update(dt);
			world.render(renderer, scene);
			speed.addDataPoint(dt);

			if (fatalErrorTriggered) return;
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

var fatalErrorTriggered = false;
function fatalError(err) {
	var container = document.getElementById('container');
	container.classList.add('error');

	var elm = splash.querySelector('.contents');
	html = [
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
	].join("\n");
	elm.innerHTML = html;

	exitPointerLock();
	fatalErrorTriggered = true;
	function exitPointerLock() {
		(document.exitPointerLock ||
		document.mozExitPointerLock ||
		document.webkitExitPointerLock).call(document);
	}
}

var sin = Math.sin;
var cos = Math.cos;
var abs = Math.abs;
var min = Math.min;
var max = Math.max;
var sqrt = Math.sqrt;
var pow = Math.pow;
