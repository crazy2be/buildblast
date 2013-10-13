define(function (require) {
	var THREE = require("THREE");

	//Gets the rotation towards the look from (0, 0, 0)
	function lookToRotation(look) {
		var dist = sqrt(look.x * look.x + look.y * look.y + look.z * look.z);
		return new THREE.Vector3(
			Math.atan2(look.y, look.z),
			0,//Math.atan2(look.x, look.z),
			0//Math.atan2(look.z, look.y),
		);
	}

	return {
		lookToRotation: lookToRotation
	};
});
