define(function (require) {
	var THREE = require("THREE");

	var PLAYER = {};
	PLAYER.HEIGHT = 1.75;
	PLAYER.EYE_HEIGHT = 1.6;
	PLAYER.BODY_HEIGHT = 1.3;
	PLAYER.HALF_EXTENTS = new THREE.Vector3(
		0.2,
		PLAYER.HEIGHT / 2,
		0.2
	);
	PLAYER.CENTER_OFFSET = new THREE.Vector3(
		0,
		PLAYER.BODY_HEIGHT / 2 - PLAYER.EYE_HEIGHT,
		0
	);
	return PLAYER;
});