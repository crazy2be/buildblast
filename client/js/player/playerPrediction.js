//We only move every tick, and we move for the duration of the tick.
//We queue up a list of the keyStates of every tick, and tell the server that we wish to move
//at those tick times.
//We then apply those movements to the player's position, to move it beyond our last confirmed position
//When the server gives us a response, we use this to update our last confirmed position (whether it
//matches of not), and reapply all our queued keyStates (which should be only 1, or even none).

function PlayerPrediction(world, conn, clock, position) {
	var self = this;

	var moveSim = window.moveSim();

	var box = new Box(position, PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);

	// predictFnc(lastDatum, auxData, dt) : newDatum
	var posBuffer = new PredictionBuffer(
		moveSim.simulateMovement.bind(null, {
			inSolid: box.inSolid, 
			world: world
		})
	);

	posBuffer.addConfirmed(0, new THREE.Vector3(0, 0, 0));

	self.update = function (controlState) {
		posBuffer.addPrediction(controlState.Timestamp, controlState.Controls);

		/* TODO: Do this stuff somewhere
		var lag = latest.Timestamp - confirmed.Timestamp;
		updateLagStats(lag);
		updateHealthBar(confirmed.Hp);
		updatePositionText(pos, vy);
		*/

		return posBuffer.getLastValue();
	};

	conn.on('player-state', function (payload) {
		//TODO: Make the server just send us this structure,
		//or handle the server structure directly.
		var ray = {};
		ray.x = payload.Pos.X;
		ray.y = payload.Pos.Y;
		ray.z = payload.Pos.Z;
		ray.dy = payload.Vy;
		posBuffer.addConfirmed(payload.Timestamp, ray);
	});

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
}
