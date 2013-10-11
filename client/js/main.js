define(function(require) {

var Conn = require("core/conn");
var Clock = require("core/clock");
var Controls = require("player/controls");
var FeatureTester = require("featureTester");
var Models = require("models");

var async = require("/lib/async.js");

var World = require("core/world");

var Entity = require("entities/playerEntity");
var PlayerUI = require("player/playerUI");
var PlayerEntity = require("entities/playerEntity");

var PerfChart = require("perf/chart");
var Box = require("geom/box");
var PLAYER = require("player/playerSize");
var movement = require("player/movement");
var EntityPredictiveController = require("entities/entityPredictiveController");

function main () {
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
	var conn = new Conn("main");
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
	});

	var updateLagStats;
	function makePlayer(world, clock, controls) {
		var lagStats = new PerfChart({
			title: ' lag'
		});
		lagStats.elm.style.position = 'absolute';
		lagStats.elm.style.top = '74px';
		lagStats.elm.style.right = '80px';
		container.appendChild(lagStats.elm);

		updateLagStats = function () {
			var lag = controller.predictionAheadBy()
			lagStats.addDataPoint(lag);
		};

		var player = new PlayerEntity();
		var box = new Box(PLAYER.HALF_EXTENTS, PLAYER.CENTER_OFFSET);
		var collides = box.collides.bind(null, world);
		var predictor = movement.simulate.bind(null, collides);
		var controller = new EntityPredictiveController(player, clock, controls, predictor);
		world.setPlayer(clientID, player, controller);
		return player;
	}

	function startGame() {
		var scene = new THREE.Scene();
		var ambientLight = new THREE.AmbientLight(0xffffff);
		scene.add(ambientLight);

		var world = new World(scene, conn, clientID, clock);
		var controls = new Controls(container);

		var player = makePlayer(world, clock, controls)
		var playerUI = new PlayerUI(world, conn, clock, container, controls, player);


		window.testExposure.playerUI = playerUI;
		window.testExposure.world = world;

		var previousTime = clock.time();
		animate();
		function animate() {
			clock.update();
			var newTime = clock.time();
			var dt = newTime - previousTime;
			previousTime = newTime;

			conn.update();

			//Unfortunately this means our data relies partially on having a Player.
			//Think of this as an optimization, if our data focuses on where our Player is located,
			//it can more efficiently handle queries.
			world.update(dt, player.pos());

			updateLagStats();

			playerUI.update(dt);
			playerUI.render(scene);

			if (fatalErrorTriggered) return;
			requestAnimationFrame(animate);
		}
	}

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
}
return main;
});
