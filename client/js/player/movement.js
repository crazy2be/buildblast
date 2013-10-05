var movement = function () {
	function attemptMove(pos, delta, collides) {
		if (collides(pos)) {
			delta.x = 0;
			delta.y = 1;
			delta.z = 0;
			return delta;
		}

		pos.x += delta.x;
		if (collides(pos)) {
			pos.x -= delta.x;
			delta.x = 0;
		}

		pos.y += delta.y;
		if (collides(pos)) {
			pos.y -= delta.y;
			delta.y = 0;
		}

		pos.z += delta.z;
		if (collides(pos)) {
			pos.z -= delta.z;
			delta.z = 0;
		}
		return delta;
	}

	function simulate(collides, state, c, dt) /* newState */ {
		var newState = {
			pos: new THREE.DVector3(0, 0, 0),
			look: new THREE.DVector3(0, 0, 0),
			vy: 0,
		};

		//For some reason this whole function treats dt as it's in seconds...
		//(on the server too).
		dt /= 1000;

		if(dt > 1) {
			dt = 1;
		}

		newState.vy = state.vy + dt * -9.81;

		var sin = Math.sin, cos = Math.cos;
		newState.look = new THREE.Vector3(
			sin(c.lat) * cos(c.lon),
			cos(c.lat),
			sin(c.lat) * sin(c.lon)
		);

		var speed = 10;

		var xzSpeed = speed * dt;
		var fw = xzSpeed*(c.forward ? 1 : c.back ? -1 : 0);
		var rt = xzSpeed*(c.right ? 1 : c.left ? -1 : 0);
		var delta = {
			x: -cos(c.lon)*fw + sin(c.lon)*rt,
			y: newState.vy*dt,
			z: -sin(c.lon)*fw - cos(c.lon)*rt,
		};

		newState.pos.copy(state.pos);

		delta = attemptMove(newState.pos, delta, collides);

		if (delta.y === 0) {
			newState.vy = c.jump ? 6 : 0;
		}
		
		return newState;
	}

	return {
		simulate: simulate,
	};
}();