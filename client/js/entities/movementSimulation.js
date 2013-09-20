var moveSim = function () {

	//Tries to apply an application of deltaMove to pos, without introducing intersections.
	function attemptMove(pos, collides, world, deltaMove) {
		//This code should probably be put to use for partial application of all movement
		//in the y direction, but if it is the server code must also be changed.
		if (collides(world, pos)) {
			deltaMove.x = 0;
			deltaMove.y = 1;
			deltaMove.z = 0;
		}

		pos.x += deltaMove.x;
		if (collides(world, pos)) {
			pos.x -= deltaMove.x;
			deltaMove.x = 0;
		}

		pos.y += deltaMove.y;
		if (collides(world, pos)) {
			pos.y -= deltaMove.y;
			deltaMove.y = 0;
		}

		pos.z += deltaMove.z;
		if (collides(world, pos)) {
			pos.z -= deltaMove.z;
			deltaMove.z = 0;
		}
	}

	function simulateMovement(userConstants, lastRay, controlState, dt) {
		var c = controlState;

		var newRay = new THREE.Vector3(0, 0, 0);

		lastRay.dy = lastRay.dy || 0;

		//We probably want to reduce 'gravity' a bit here
		newRay.dy = lastRay.dy + dt * -9.81;

		//Hardcoded for now?
		var speed = 10 / 1000; //10 per second?

		var xzSpeed = speed * dt;
		var fw = xzSpeed*(c.forward ? 1 : c.back ? -1 : 0);
		var rt = xzSpeed*(c.right ? 1 : c.left ? -1 : 0);
		var move = {
			x: -cos(c.lon) * fw + sin(c.lon) * rt,
			y: newRay.dy * dt,
			z: -sin(c.lon) * fw - cos(c.lon) * rt,
		};

		newRay.x = lastRay.x;
		newRay.y = lastRay.y;
		newRay.z = lastRay.z;

		attemptMove(newRay, userConstants.collides, userConstants.world, move);

		if (move.y === 0) {
			newRay.dy = c.jump ? 6 : 0;
		}

		return newRay;
	}

	return {
		attemptMove: attemptMove,
		simulateMovement: simulateMovement
	};
};