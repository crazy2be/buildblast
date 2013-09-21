//TODO: Make 2 of these, one for the "player" entity and one for
//	regular entities. This if we every optimize out the base code
//	so it is different (specialized) for each case (to make it faster),
//	we will have a layer that can make the switch seamless.

//We store a buffer of important "events" (such as controlStates), and timestamps for
//	these events. Some of these events are just predictions, and so may be overriden later.
//At any time we can give a position at any time, although future times will be wrong,
//	and predicted times may change.

//.pos delay:
//	== -1, means always give the most recent position
//	> 0, means give the 'closest' (TODO: elaborate on this word) position
//		 to clock.time() - delay

function EntityPrediction(world, clock, initialPos) {
	var self = this;

	var box = new Box(PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);

	// predictFnc(lastDatum, auxData, dt) : newDatum
	var posBuffer = new MovementBuffer(
		moveSim.simulateMovement.bind(null, {
			collides: box.collides, 
			world: world
		})
	);

	var _delay = -1;

	posBuffer.addConfirmed(0, initialPos);

	self.predictMovement = function (controlState) {
		posBuffer.addPrediction(controlState.Timestamp, controlState.Controls);
	};

	self.posMessage = function (payload) {
		//TODO: Make the server just send us this structure,
		//or handle the server structure directly.
		var ray = {};
		ray.x = payload.Pos.X;
		ray.y = payload.Pos.Y;
		ray.z = payload.Pos.Z;
		ray.dy = payload.Vy;
		posBuffer.addConfirmed(payload.Timestamp, ray);

		//rot = makeVec3(tickData.Rot);
	};

	self.pos = function () {
		if (_delay == -1) {
			return posBuffer.getLastValue();
		}

		if (_delay > 0) {
			return posBuffer.getValueAt(clock.time() - _delay);
		}

		throw "No delay is defined for delay of: " + _delay;
	};

	self.contains = function (x, y, z) {
		return pointCollides(
			new THREE.Vector3(x, y, z),
			box.boundingBox(self.pos())
		);
	};

	self.setDelay = function (delay) {
		_delay = delay;
	};

	//TODO: Not strictly speaking lag, hopefully if nothing moves we won't get any
	//move messages, this should instead be the time since our last sent message
	//and last received (but I am too lazy to implement that now).
	self.lag = function () {
		return clock.time() - posBuffer.lastConfirmedTime();
	}
}
