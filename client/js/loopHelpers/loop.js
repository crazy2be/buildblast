var LOOP = {};

//Loops starting at startPoint.x, .y, .z and loops
//the distance of spanVector.z, .y, .z on each axis,
//calling the callback with current THREE.Vector3 each iteration.
LOOP.For3D = function (startPoint, spanVector, callback) {
    for (var xOffset = 0; xOffset < spanVector.x; xOffset++) {
        for (var yOffset = 0; yOffset < spanVector.y; yOffset++) {
            for (var zOffset = 0; zOffset < spanVector.z; zOffset++) {
                callback(new THREE.Vector3(
                                startPoint.x + xOffset,
                                startPoint.y + yOffset,
                                startPoint.z + zOffset));
            }
        }
    }
}