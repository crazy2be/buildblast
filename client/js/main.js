define(function(require) {

var async = require("async");

var Conn = require("core/conn");
var Clock = require("core/clock");
var Controls = require("player/controls");
var FeatureTester = require("featureTester");
var Models = require("models");

var World = require("core/world");

var PlayerUI = require("player/playerUI");
var EntityManager = require("entities/entityManager");

var PerfChart = require("perf/chart");
var movement = require("player/movement");
var EntityInputPredictor = require("entities/entityInputPredictor");

var fatalError = require("fatalError");

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
	var conn = new Conn(Conn.socketURI("main"));
	var clock = new Clock(conn);
	var clientID;
	var playerEntity;

	async.parallel([
		function (callback) {
			Models.init(callback);
		},
		function (callback) {
			conn.on('handshake-reply', function (payload) {
				console.log("Got handshake reply:", payload);
				clock.init(payload.ServerTime);
				clientID = payload.ClientID;
				playerEntity = EntityManager.makeEntity(payload.PlayerEntityInfo)
				conn.setImmediate(false);
				callback();
			});
			conn.on('handshake-error', function (payload) {
				throw payload.Message;
			});
		}
	], function (err, results) {
		startGame();
	});

	function makePlayerController(world) {
		var box = playerEntity.box();
		function collides(pos) {
			box.setPosition(pos);
			return box.collides(world);
		}
		var predictor = movement.simulate.bind(null, collides);
		var controller = new EntityInputPredictor(playerEntity, predictor);
		return controller;
	}

	function startGame() {
		var scene = new THREE.Scene();
		var ambientLight = new THREE.AmbientLight(0xffffff);
		scene.add(ambientLight);

		var world = new World(scene, conn, clientID, clock);
		var controls = new Controls(container);

		var playerController = makePlayerController(world);
		var playerUI = new PlayerUI(world, conn, clock, container, controls, playerEntity, playerController);
		world.setPlayer(clientID, playerEntity, playerController);

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

			playerUI.update(dt);

			//Unfortunately this means our data relies partially on having a Player.
			//Think of this as an optimization, if our data focuses on where our Player is located,
			//it can more efficiently handle queries.
			world.update(dt, playerEntity.pos());

			playerUI.render(scene);

			if (fatalError.fatalErrorTriggered) return;
			requestAnimationFrame(animate);
		}
	}
}
return main;
});
