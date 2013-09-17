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

function Player(world, conn, clock, container) {
	var self = this;

	var controls = new Controls(container);
	var chat = new Chat(controls, conn, container);

	var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1024);
	var inventory = new Inventory(world, camera, conn, controls);
	var prediction = new PlayerPrediction(world, conn, clock, camera.position);

	var speed;

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
		};
		conn.queue('controls-state', controlState);

		var playerPos = prediction.update(controlState);

		var camPos = playerPos.clone();
		if(localStorage.thirdPerson) {
			var target = getTarget(camPos, controlState);
			var look = target.clone().sub(camPos);
			look.setLength(3);
			camPos.sub(look);
		}
		camera.position.set(camPos.x, camPos.y, camPos.z);

		doLook(camera, camPos, controlState);
		inventory.update(playerPos, controlState);

		speed.addDataPoint(dt);
	};

	function getTarget(p, c) {
		var target = new THREE.Vector3();
		target.x = p.x + sin(c.lat) * cos(c.lon);
		target.y = p.y + cos(c.lat);
		target.z = p.z + sin(c.lat) * sin(c.lon);
		return target;
	}

	function doLook(camera, p, c) {
		camera.lookAt(getTarget(p, c));
	}
};
