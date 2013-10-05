var moveSim = function () {

	//Tries to apply an application of delta to pos, without introducing intersections.
	function attemptMove(world, pos, collides, delta) {
		//This code should probably be put to use for partial application of all movement
		//in the y direction, but if it is the server code must also be changed.
		if (collides(world, pos)) {
			delta.x = 0;
			delta.y = 1;
			delta.z = 0;
			return;
		}

		pos.x += delta.x;
		if (collides(world, pos)) {
			pos.x -= delta.x;
			delta.x = 0;
		}

		pos.y += delta.y;
		if (collides(world, pos)) {
			pos.y -= delta.y;
			delta.y = 0;
		}

		pos.z += delta.z;
		if (collides(world, pos)) {
			pos.z -= delta.z;
			delta.z = 0;
		}
	}

	function simulateMovement(world, collides, lastPosState, controlState, dt) {
		var c = controlState;
		
		var newPosState = {
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

		newPosState.vy = lastPosState.vy + dt * -9.81;

		var sin = Math.sin, cos = Math.cos;
		newPosState.look = new THREE.Vector3(
			sin(c.lat) * cos(c.lon),
			cos(c.lat),
			sin(c.lat) * sin(c.lon)
		);

		var speed = 10;

		var xzSpeed = speed * dt;
		var fw = xzSpeed*(c.forward ? 1 : c.back ? -1 : 0);
		var rt = xzSpeed*(c.right ? 1 : c.left ? -1 : 0);
		var move = {
			x: -cos(c.lon) * fw + sin(c.lon) * rt,
			y: newPosState.vy * dt,
			z: -sin(c.lon) * fw - cos(c.lon) * rt,
		};

		newPosState.pos.copy(lastPosState.pos);

		attemptMove(world, newPosState.pos, collides, move);

		if (move.y === 0) {
			newPosState.vy = c.jump ? 6 : 0;
		}
		
		return newPosState;
	}

	return {
		simulateMovement: simulateMovement
	};
}();