//QTODO: Make 2 of these, one for the "player" entity and one for
//	regular entities. This if we every optimize out the base code
//	so it is different (specialized) for each case (to make it faster),
//	we will have a layer that can make the switch seamless.

//We store a buffer of important "events" (such as controlStates), and timestamps for
//	these events. Some of these events are just predictions, and so may be overriden later.
//At any time we can give a position at any time, although future times will be wrong,
//	and predicted times may change.

//Essentially implements lag induction.

function PosPrediction(world, clock, initialPosState) {
	var self = this;

	var box = new Box(PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);

	var lagInducedMaxHistory = 101;
	var normalMaxHistory = 151;

	var _lagInduced = true;
	// predictFnc(lastDatum, auxData, dt) : newDatum
	var posBuffer = new ContextBuffer(
		moveSim.simulateMovement.bind(null, 
			world, {
				collides: box.collides
			}
		), lagInducedMaxHistory
	);

	posBuffer.addConfirmed(Number.NEGATIVE_INFINITY, initialPosState);

	self.predictMovement = function (controlState) {
		posBuffer.addPrediction(controlState.Timestamp, controlState.Controls);
	};

	self.posMessage = function (payload) {
		var p = payload.Pos;
		var l = payload.Look;
		var newPosState = {
			pos: new THREE.Vector3(p.X, p.Y, p.Z),
			dy: payload.Vy,
			look: new THREE.Vector3(l.X, l.Y, l.Z),
		};
		
		posBuffer.addConfirmed(payload.Timestamp, newPosState);
	};

	self.posState = function () {
		if (!_lagInduced) {
			return posBuffer.getLastValue();
		}

		var curTime = clock.entityTime();

		if (curTime < posBuffer.firstTime()) {
			throttledError("Requested position at time before any positions in buffer.");
		}

		if (curTime > posBuffer.lastTime()) {
			throttledWarn("Requested position at time after any positions in buffer.");
		}

		if (posBuffer.largestConfirmedTime() < posBuffer.firstTime()) {
			throttledWarn("Queued predictions have exceeded buffer and no confirmed messages are currently stored!");
		}

		return posBuffer.getValueAt(curTime);
	};

	self.contains = function (x, y, z) {
		return box.contains(x, y, z);
	};

	//If true our .pos() will return times based on clock.entityTime(),
	//	else we will just use the earliest times (not strictly times
	//	based on clock.time(), but in almost all cases should be equivalent).
	//True by default.
	self.lagInduce = function (lagInduce) {
		_lagInduced = lagInduce;

		posBuffer.setMaxHistory(_lagInduced ? 
			lagInducedMaxHistory : normalMaxHistory);
	};

	//QTODO: Not strictly speaking lag, hopefully if nothing moves we won't get any
	//move messages, this should instead be the time since our last sent message
	//and last received (but I am too lazy to implement that now).
	self.lag = function () {
		return clock.time() - posBuffer.largestConfirmedTime();
	};

	self.getVelocity = function () {
		if (!_lagInduced) {
			//QTODO: Make this use the last values, not clock.time()?
			return posBuffer.getVelocity(clock.time());
		}

		return posBuffer.getVelocity(clock.entityTime());
	};

	if (localStorage.posHistoryBar) {
		//Only use these for debugging!
		self.posDebugData = function () {
			var data = [];
			var dataTimes = posBuffer.dataTimes();
			var dataPositions = posBuffer.dataPositions();
			var auxDataTimes = posBuffer.auxDataTimes();

			var auxPosition = 0;
			var posPosition = 0;

			dataTimes.forEach(function (dataTime) {
				var datum = { time: dataTime, hasAuxData: false, pos: dataPositions[posPosition].pos };

				var hasAuxData = false;
				while (auxPosition < auxDataTimes.length &&
					auxDataTimes[auxPosition] <= dataTime) {
					//So many assumptions about this data is made right here...
					datum.hasAuxData = auxDataTimes[auxPosition] == dataTime;
					auxPosition++;
				}
				data.push(datum);
				posPosition++;
			});

			return data;
		};
	}
}
