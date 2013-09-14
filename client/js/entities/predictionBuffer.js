function PredictionBuffer(world) {
	var self = this;

	var dataHistory = new historyBuffer(
		new THREE.Vector3(0, 0, 0), 0, 30);

	var auxDataHistory = new historyBuffer(
		new THREE.Vector3(0, 0, 0), 0, 30);

	var predictFnc = function (lastDatum, newDatum, auxData, dt) {
		
	};

	self.addPrediction = function (time, controlData) {
		
	};

	self.addConfirmed = function (time, pos) {
	};
}