define(function(require) {
var Controls = require("player/controls");
var Chat = require("player/chat");
var Scoreboard = require("player/scoreboard");

var THREE = require("THREE");

var Inventory = require("player/inventory");

var PerfChart = require("perf/chart");

return function PlayerUI(world, conn, clock, container, controls, playerEntity, playerController) {
	var self = this;

	var chat = new Chat(controls, conn, container);
	var scoreBoard = new Scoreboard(controls, conn, container);

	var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1024);
	var inventory = new Inventory(world, camera, conn, controls);

	var speedChart = initSpeedChart();
	function initSpeedChart() {
		var speedChart = new PerfChart({
			title: ' render',
			maxValue: 50,
		});
		speedChart.elm.style.position = 'absolute';
		speedChart.elm.style.top = '74px';
		speedChart.elm.style.right = '0px';
		container.appendChild(speedChart.elm);
		return speedChart;
	}

	var lagChart = initLagChart();
	function initLagChart() {
		var lagChart = new PerfChart({
			title: ' lag'
		});
		lagChart.elm.style.position = 'absolute';
		lagChart.elm.style.top = '74px';
		lagChart.elm.style.right = '80px';
		container.appendChild(lagChart.elm);
		return lagChart;
	}

	var renderer = initRenderer();
	function initRenderer() {
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);

		container.querySelector('#opengl').appendChild(renderer.domElement);
		document.querySelector('#splash h1').innerHTML = 'Click to play!';

		return renderer;
	}

	window.addEventListener('resize', onWindowResize, false);
	function onWindowResize() {
		renderer.autoClear = true;
		renderer.setSize(window.innerWidth, window.innerHeight);

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		inventory.resize();
	}

	function pos () {
		return playerEntity.pos();
	};

	self.render = function (scene) {
		renderer.render(scene, camera);
	};

	self.update = function () {
		chat.update(clock.dt());
		scoreBoard.update(clock.dt());

		var c = controls.sample();

		var controlState = {
			Controls: c,
			Timestamp: clock.time(),
			ViewTimestamp: clock.entityTime()
		};
		conn.queue('controls-state', controlState);
		playerController.realUpdate(clock, controls, playerEntity);

		var camPos = pos().clone();

		if (localStorage.thirdPerson) {
			var target = calcTarget(camPos, c.lat, c.lon);
			var look = target.clone().sub(camPos);
			look.setLength(3);
			camPos.sub(look);
		}

		camera.position.set(camPos.x, camPos.y, camPos.z);

		doLook(camera, camPos, c);
		inventory.update(pos(), c);

		updatePositionText(pos(), pos().dy);
		updateHealthBar(playerEntity.health());

		speedChart.addDataPoint(clock.dt());
		var lag = playerController.predictionAheadBy();
		lagChart.addDataPoint(lag);
	};

	function calcTarget(p, lat, lon) {
		var target = new THREE.Vector3();
		target.x = p.x + sin(lat) * cos(lon);
		target.y = p.y + cos(lat);
		target.z = p.z + sin(lat) * sin(lon);
		return target;
	}

	function doLook(camera, p, c) {
		camera.lookAt(calcTarget(p, c.lat, c.lon));
	}

	// TODO: Move this stuff out into a playerView.
	// It doesn't really belong here.
	var prevhp = -1;
	function updateHealthBar(hp) {
		if (hp === prevhp) return;
		prevhp = hp;

		var health = document.getElementById('health-value');
		if (!health) return;

		health.style.width = hp + '%';
		if (hp < 25) {
			health.classList.add('critical');
		} else if (hp < 50) {
			health.classList.add('low');
		} else {
			health.classList.remove('critical');
			health.classList.remove('low');
		}

		// Force animations to restart
		var newHealth = health.cloneNode(true);
		health.parentNode.replaceChild(newHealth, health);
	}

	var prevpos = new THREE.Vector3(0, 0, 0);
	function updatePositionText(pos, vy) {
		if (pos.equals(prevpos)) return;
		prevpos = pos;

		var info = document.getElementById('info');
		if (!info) return;

		info.innerHTML = JSON.stringify({
			x: round(pos.x, 2),
			y: round(pos.y, 2),
			z: round(pos.z, 2),
			v: round(vy, 2),
		});
	}

	function round(n, digits) {
		var factor = Math.pow(10, digits);
		return Math.round(n * factor) / factor;
	}
};
});
