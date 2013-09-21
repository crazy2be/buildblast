window.onload = function () {
	var container = document.getElementById('container');
	var tester = new FeatureTester();
	tester.run();
	if (!tester.pass()) {
		container.innerHeight = '';
		container.appendChild(tester.errors());
		return;
	}

	//We use this to expose certain variables for test code.
	window.testExposure = { };

	//Connect to server and shake our hands.
	var conn = new Conn(getWSURI("main/"));
	var clock = new Clock(conn);
	var clientID;

	async.parallel([
		function (callback) {
			Models.init(callback);
		},
		function (callback) {
			conn.on('handshake-reply', function (payload) {
				console.log("Got handshake reply:", payload);
				clock.init(payload.ServerTime);
				clientID = payload.ClientID;
				conn.setImmediate(false);
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
		var ambientLight = new THREE.AmbientLight(0xffffff);
		scene.add(ambientLight);

		var world = new World(scene, conn, clientID, clock);
		var player = new PlayerUI(world, conn, clock, container, clientID);

		window.testExposure.player = player;
		window.testExposure.world = world;

		var previousTime = clock.time();
		animate();
		function animate() {
			clock.update();
			var newTime = clock.time();
			var dt = newTime - previousTime;
			previousTime = newTime;

			conn.update();

			player.update(dt);

			//Unfortunately this means our data relies partially on having a Player.
			//Think of this as an optimization, if our data focuses on where our Player is looking,
			//it can more efficiently handle queries.
			world.update(dt, player.pos());

			player.render(scene);

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