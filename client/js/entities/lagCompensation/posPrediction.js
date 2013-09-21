//TODO: Make 2 of these, one for the "player" entity and one for
//	regular entities. This if we every optimize out the base code
//	so it is different (specialized) for each case (to make it faster),
//	we will have a layer that can make the switch seamless.

//We store a buffer of important "events" (such as controlStates), and timestamps for
//	these events. Some of these events are just predictions, and so may be overriden later.
//At any time we can give a position at any time, although future times will be wrong,
//	and predicted times may change.

function PosPrediction(world, clock, initialPos) {
	var self = this;

	var box = new Box(PLAYER_HALF_EXTENTS, PLAYER_CENTER_OFFSET);

	// predictFnc(lastDatum, auxData, dt) : newDatum
	var posBuffer = new ContextBuffer(
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
		var ray = new THREE.Vector3(
			payload.Pos.X,
			payload.Pos.Y,
			payload.Pos.Z);
		ray.dy = payload.Vy;
		posBuffer.addConfirmed(payload.Timestamp, ray);

		//rot = makeVec3(tickData.Rot);
	};

	var _useEntityTime = true;
	self.pos = function () {
		if (!_useEntityTime) {
			return posBuffer.getLastValue();
		}

		var curTime = clock.entityTime();

		if (curTime < posBuffer.firstTime()) {
			console.error("Requested position at time before any positions in buffer.");
		}

		if (curTime > posBuffer.lastTime()) {
			console.warn("Requested position at time after any positions in buffer.");
		}

		if (posBuffer.lastConfirmedTime() < posBuffer.firstTime()) {
			console.warn("Queued predictions have exceeded buffer and no confirmed messages are currently stored!");
		}

		return posBuffer.getValueAt(curTime);
	};

	self.contains = function (x, y, z) {
		return pointCollides(
			new THREE.Vector3(x, y, z),
			box.boundingBox(self.pos())
		);
	};

	//If true our .pos() will return times based on clock.entityTime(),
	//	else we will just use the earliest times (not strictly times
	//	based on clock.time(), but in almost all cases should be equivalent).
	//True by default.
	self.setUseEntityTime = function (useEntityTime) {
		_useEntityTime = useEntityTime;
	};

	//TODO: Not strictly speaking lag, hopefully if nothing moves we won't get any
	//move messages, this should instead be the time since our last sent message
	//and last received (but I am too lazy to implement that now).
	self.lag = function () {
		return clock.time() - posBuffer.lastConfirmedTime();
	}

	if (localStorage.debug) {
		//Only use these for debugging!
		self.posDebugData = function () {
			var data = [];
			var dataTimes = posBuffer.dataTimes();
			var dataPositions = posBuffer.dataPositions();
			var auxDataTimes = posBuffer.auxDataTimes();

			var auxPosition = 0;
			var posPosition = 0;

			dataTimes.forEach(function (dataTime) {
				var datum = { time: dataTime, hasAuxData: false, pos: dataPositions[posPosition] };

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
