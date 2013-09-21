//We only move every tick, and we move for the duration of the tick.
//We queue up a list of the keyStates of every tick, and tell the server that we wish to move
//at those tick times.
//We then apply those movements to the player's position, to move it beyond our last confirmed position
//When the server gives us a response, we use this to update our last confirmed position (whether it
//matches of not), and reapply all our queued keyStates (which should be only 1, or even none).

function EntityPrediction(world, clock, initialPos) {
	var self = this;

	var moveSim = window.moveSim();

	var box = new Box(PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);

	// predictFnc(lastDatum, auxData, dt) : newDatum
	var posBuffer = new PredictionBuffer(
		moveSim.simulateMovement.bind(null, {
			collides: box.collides, 
			world: world
		})
	);

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
		return posBuffer.getLastValue();
	};

	self.contains = function (x, y, z) {
		return pointCollides(
			new THREE.Vector3(x, y, z),
			box.boundingBox(self.pos())
		);
	}
}
