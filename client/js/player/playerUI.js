var PLAYER_HEIGHT = 1.75;
var PLAYER_EYE_HEIGHT = 1.6;
var PLAYER_BODY_HEIGHT = 1.3;
var PLAYER_HALF_EXTENTS = new THREE.Vector3(
	0.2,
	PLAYER_HEIGHT / 2,
	0.2
);
var PLAYER_CENTER_OFFSET = new THREE.Vector3(
	0,
	PLAYER_BODY_HEIGHT/2 - PLAYER_EYE_HEIGHT,
	0
);

function PlayerUI(world, conn, clock, container, clientID) {
	var self = this;

	var controls = new Controls(container);
	var chat = new Chat(controls, conn, container);

	var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1024);
	var inventory = new Inventory(world, camera, conn, controls);

	var speed;

	var _curEntity = null;
	function curEntity() {
		//QTODO: Handle our entity being removed?
		if(_curEntity) return _curEntity;
		_curEntity = world.entityManager.getEntity(clientID);
		return _curEntity;
	}

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

	self.pos = function () {
		if(curEntity()) {
			//QTODO: Call this when we first hook into the player!
			curEntity().setIsPlayer(true);
			return curEntity().pos();
		} else {
			return new THREE.Vector3(0, 0, 0);
		}
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
		conn.queue('controls-state', controlState);

		if(curEntity()) {
			curEntity().predictMovement(controlState);
		}

		var camPos = self.pos().clone();

		var c = controlState.Controls;

		if(localStorage.thirdPerson) {
			var target = getTarget(camPos, c);
			var look = target.clone().sub(camPos);
			look.setLength(3);
			camPos.sub(look);
		}
		camera.position.set(camPos.x, camPos.y, camPos.z);

		doLook(camera, camPos, c);
		inventory.update(self.pos(), c);

		if(curEntity()) {
			updateLagStats(curEntity().lag());

			var pos = self.pos();
			updatePositionText(pos, pos.dy);
			updateHealthBar(curEntity().health());
		}

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
