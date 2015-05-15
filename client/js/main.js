define(function(require) {

var async = require("async");

var Conn = require("core/conn");
var ConnTest = require("core/connTest");
var Clock = require("core/clock");
var Controls = require("player/controls");
var FeatureTester = require("featureTester");
var Models = require("models");

var World = require("core/world");
var Protocol = require("core/protocol");

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

	// Test a lot of awesome stuff
	var conn2 = new ConnTest(Conn.socketURI("proto"));
	conn2.on(0, function(dataView) {
		function uintToString(uintArray) {
			var encodedString = String.fromCharCode.apply(null, uintArray);
			return decodeURIComponent(escape(encodedString));
		}
		console.log("Got message:", uintToString(new Uint8Array(dataView.buffer.slice(1))));
	});
	conn2.on(1, function(dataView) {
		var threeVec = Protocol.threeVecFromBinProto(1, dataView);
		console.log(threeVec);
		var buffer = new ArrayBuffer(25);
		var dataView = new DataView(buffer);
		dataView.setUint8(0, 1);
		dataView.setFloat64(1, threeVec.x);
		dataView.setFloat64(1 + 8, threeVec.y);
		dataView.setFloat64(1 + 16, threeVec.z);
		conn2.queue(dataView);
	});
	var uint8 = new Uint8Array(2);
	uint8[0] = 0;
	uint8[1] = 42;
	conn2.queue(uint8);

	async.parallel([
		function (callback) {
			Models.init(callback);
		},
		function (callback) {
			conn.on('handshake-reply', function (payload) {
				console.log("Got handshake reply:", payload);
				clock.init(payload.ServerTime);
				clientID = payload.ClientID;
				playerEntity = EntityManager.createPlayerEntity(payload.PlayerEntityInfo)
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
		function collides(box, pos) {
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
		var playerUI = new PlayerUI(world, conn, clock, container, controls, playerEntity,
				playerController);
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
