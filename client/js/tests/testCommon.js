var LOOP = {};

LOOP.For3D = function (startPoint, span, fnc) {
	for (var ix = startPoint.x; ix < startPoint.x + span.x; ix++) {
		for (var iy = startPoint.y; iy < startPoint.y + span.y; iy++) {
			for (var iz = startPoint.z; iz < startPoint.z + span.z; iz++) {
				if (fnc(new THREE.Vector3(ix, iy, iz))) return;
			}
		}
	}
};
