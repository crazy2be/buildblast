define(function (require) {
	//Tries to apply an application of deltaMove to pos, without introducing intersections.
	function attemptMove(world, pos, collides, deltaMove) {
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

	function simulateMovement(world, userConstants, lastPosState, controlState, dt) {
		var c = controlState;
		
		var newPosState = {
			pos: new THREE.Vector3(0, 0, 0),
			dy: 0,
			look: new THREE.Vector3(0, 0, 0),
		};

		//For some reason this whole function treats dt as it's in seconds...
		//(on the server too).
		dt /= 1000;

		if(dt > 1) {
			dt = 1;
		}

		//We probably want to reduce 'gravity' a bit here
		newPosState.dy = lastPosState.dy + dt * -9.81;

		//QTODO: Probably a function which does this, should use that instead.
		var cos = Math.cos;
		var sin = Math.sin;
		var lat = controlState.lat;
		var lon = controlState.lon;
		newPosState.look = new THREE.Vector3(
						sin(lat) * cos(lon),
						cos(lat),
						sin(lat) * sin(lon)
					);

		//Hardcoded for now?
		var speed = 10; //10 per second

		var xzSpeed = speed * dt;
		var fw = xzSpeed*(c.forward ? 1 : c.back ? -1 : 0);
		var rt = xzSpeed*(c.right ? 1 : c.left ? -1 : 0);
		var move = {
			x: -cos(c.lon) * fw + sin(c.lon) * rt,
			y: newPosState.dy * dt,
			z: -sin(c.lon) * fw - cos(c.lon) * rt,
		};

		newPosState.pos.x = lastPosState.pos.x;
		newPosState.pos.y = lastPosState.pos.y;
		newPosState.pos.z = lastPosState.pos.z;

		attemptMove(world, newPosState.pos, userConstants.collides, move);

		if (move.y === 0) {
			newPosState.dy = c.jump ? 6 : 0;
		}

		return newPosState;
	}

	function interpolatePosState(time, posStateBefore, timeBefore, posStateAfter, timeAfter) {
		return {
			pos: lerp(time,
				posStateBefore.pos,
				timeBefore,
				posStateAfter.pos,
				timeAfter
			),
			dy: weightedValue(time, posStateBefore.dy, timeBefore, posStateAfter.dy, timeAfter),
			look: lerp(time,
				posStateBefore.look,
				timeBefore,
				posStateAfter.look,
				timeAfter
			),
		};
	}

	function weightedValue (t, vOld, tOld, vNew, tNew) {
		var timeSpan = tNew - tOld;
		var oldWeight = (tNew - t) / timeSpan;
		var newWeight = (t - tOld) / timeSpan;

		return vOld*oldWeight + vNew*newWeight;
	}
		
	//http://docs.unity3d.com/Documentation/ScriptReference/Vector3.Lerp.html
	function lerp (t, pOld, tOld, pNew, tNew) {
		var timeSpan = tNew - tOld;
		var oldWeight = (tNew - t) / timeSpan;
		var newWeight = (t - tOld) / timeSpan;

		return new THREE.Vector3(
			pOld.x*oldWeight + pNew.x*newWeight,
			pOld.y*oldWeight + pNew.y*newWeight,
			pOld.z*oldWeight + pNew.z*newWeight
		);
	}

	return {
		attemptMove: attemptMove,
		simulateMovement: simulateMovement,
		interpolatePosState: interpolatePosState
	};
});