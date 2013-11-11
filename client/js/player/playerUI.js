define(function(require) {
	var Controls = require("player/controls");
	var Chat = require("player/chat");

	var THREE = require("THREE");

	var Inventory = require("player/inventory");

	var PerfChart = require("perf/chart");

	return function PlayerUI(world, conn, clock, container, playerEntity) {
		var self = this;

		var controls = new Controls(container);
		var chat = new Chat(controls, conn, container);

		var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1024);
		var inventory = new Inventory(world, camera, conn, controls);

		var speed;

		//Set up entity as a player.
		playerEntity.lagInduce(false);
		playerEntity.setViewVisibility(localStorage.viewsVisible);

		var renderer = new THREE.WebGLRenderer();
		initializeRenderer();
		function initializeRenderer() {
			renderer.setSize(window.innerWidth, window.innerHeight);

			container.querySelector('#opengl').appendChild(renderer.domElement);
			document.querySelector('#splash h1').innerHTML = 'Click to play!';

			speed = new PerfChart({
				title: ' render',
				maxValue: 50,
			});
			speed.elm.style.position = 'absolute';
			speed.elm.style.top = '74px';
			speed.elm.style.right = '0px';
			container.appendChild(speed.elm);
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

		self.cameraPos = function() {
			return camera.position.clone();
		};

		self.render = function (scene) {
			renderer.render(scene, camera);
		};

		self.update = function (dt) {
			chat.update(dt);

			var controlState = {
				Controls: controls.sample(),
				Timestamp: clock.time(),
				ViewTimestamp: clock.entityTime()
			};
			playerEntity.predictMovement(controlState);
			conn.queue('controls-state', controlState);

			var camPos = pos().clone();

			var c = controlState.Controls;

			if(localStorage.thirdPerson) {
				var target = calcTarget(camPos, c.lat, c.lon);
				var look = target.clone().sub(camPos);
				look.setLength(3);
				camPos.sub(look);
				//camPos.add(new THREE.Vector3(0, 1, 0));
			}
			camera.position.set(camPos.x, camPos.y, camPos.z);

			doLook(camera, camPos, c);
			inventory.update(pos(), c);

			updateLagStats(playerEntity.lag());

			updatePositionText(pos(), pos().dy);
			updateHealthBar(playerEntity.health());

			speed.addDataPoint(dt);
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

		//QTODO: Move this stuff out into a playerView
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

		var lagStats = new PerfChart({
			title: ' lag'
		});
		lagStats.elm.style.position = 'absolute';
		lagStats.elm.style.top = '74px';
		lagStats.elm.style.right = '80px';
		document.getElementById('container').appendChild(lagStats.elm);
		function updateLagStats(lag) {
			lagStats.addDataPoint(lag);
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