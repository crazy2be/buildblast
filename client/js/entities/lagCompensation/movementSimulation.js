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
		};
		addDebugWatch(newPosState, "vy");
		newPosState.vy = 0;

		//For some reason this whole function treats dt as it's in seconds...
		//(on the server too).
		dt /= 1000;

		if(dt > 1) {
			dt = 1;
		}

		//We probably want to reduce 'gravity' a bit here
		newPosState.vy = lastPosState.vy + dt * -9.81;

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
			y: newPosState.vy * dt,
			z: -sin(c.lon) * fw - cos(c.lon) * rt,
		};

		newPosState.pos.copy(lastPosState.pos);

		attemptMove(world, newPosState.pos, collides, move);

		if (move.y === 0) {
			newPosState.vy = c.jump ? 6 : 0;
		}
		
		// TODO: Don't be stupid
		lastPosState.pos.copy(newPosState.pos);
		lastPosState.look.copy(newPosState.look);
		lastPosState.vy = newPosState.vy;

		return newPosState;
	}

	function interpolatePosState(time, posStateBefore, timeBefore, posStateAfter, timeAfter) {
		return {
			pos: lerpVec3(time,
				posStateBefore.pos,
				timeBefore,
				posStateAfter.pos,
				timeAfter
			),
			dy: lerp(time, posStateBefore.dy, timeBefore, posStateAfter.dy, timeAfter),
			look: lerpVec3(time,
				posStateBefore.look,
				timeBefore,
				posStateAfter.look,
				timeAfter
			),
		};
	}

	function lerp (t, vOld, tOld, vNew, tNew) {
		var timeSpan = tNew - tOld;
		var oldWeight = (t - tOld) / timeSpan;
		var newWeight = (tNew - t) / timeSpan;

		return vOld*oldWeight + vNew*newWeight;
	}
	//http://docs.unity3d.com/Documentation/ScriptReference/Vector3.Lerp.html
	function lerpVec3 (t, pOld, tOld, pNew, tNew) {
		var timeSpan = tNew - tOld;
		var oldWeight = (t - tOld) / timeSpan;
		var newWeight = (tNew - t) / timeSpan;

		return new THREE.Vector3(
			pOld.x*oldWeight + pNew.x*newWeight,
			pOld.y*oldWeight + pNew.y*newWeight,
			pOld.z*oldWeight + pNew.z*newWeight
		);
	}

	return {
		simulateMovement: simulateMovement,
		interpolatePosState: interpolatePosState
	};
}();