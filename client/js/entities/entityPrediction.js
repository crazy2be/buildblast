//We only move every tick, and we move for the duration of the tick.
//We queue up a list of the keyStates of every tick, and tell the server that we wish to move
//at those tick times.
//We then apply those movements to the player's position, to move it beyond our last confirmed position
//When the server gives us a response, we use this to update our last confirmed position (whether it
//matches of not), and reapply all our queued keyStates (which should be only 1, or even none).

function EntityPrediction(world, conn, clock, box, initialPos) {
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

	posBuffer.addConfirmed(0, initialPos);

	self.update = function (controlState) {
		posBuffer.addPrediction(controlState.Timestamp, controlState.Controls);

		var pos = posBuffer.getLastValue();
		box.setPos(pos);

		return pos;
	};
}
