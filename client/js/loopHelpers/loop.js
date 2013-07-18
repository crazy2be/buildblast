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

LOOP.For2D = function (startPoint, spanVector, callback) {
    for (var xOffset = 0; xOffset < spanVector.x; xOffset++) {
        for (var yOffset = 0; yOffset < spanVector.y; yOffset++) {
            callback(new THREE.Vector3(
                            startPoint.x + xOffset,
                            startPoint.y + yOffset));
        }
    }
}

var LOOP_CUBEFACES_DATA = [
//Face normal, components of face, component of normal (same as THREE.js, x=0, y=1, z=2)
//The order is important here! It makes sure the normals line up with the 'face numbers' given
//by Block.getColors.
    [new THREE.Vector3(1, 0, 0), [1, 2], 0],
    [new THREE.Vector3(-1, 0, 0), [1, 2], 0],
    [new THREE.Vector3(0, 1, 0), [0, 2], 1],
    [new THREE.Vector3(0, -1, 0), [0, 2], 1],
    [new THREE.Vector3(0, 0, 1), [0, 1], 2],
    [new THREE.Vector3(0, 0, -1), [0, 1], 2],
];
//Basically just loops over LOOP_CUBEFACES_DATA and passes you the objects.
LOOP.CubeFaces = function (callback) {
    LOOP_CUBEFACES_DATA.forEach(function (cubeFaceArray) {
        callback.apply(null, cubeFaceArray);
    });
}

//Not really sure where these belongs
function CallWithVector3(callback, vector3) {
    return callback(vector3.x, vector3.y, vector3.z);
}

//Kinda like clamp, but wraps (10 wrapped from 0 to 10 is 0, 10 wrapper from 2 to 5 is 4)
//Don't look at the history for this function, it may be bad now,
//but before it was so utterly broken in every way.
function WrapNumber(number, min, max) {
    var result = (number - min) % (max - min);
    if (result < 0) result = (max - min) + result;
    result += min;
    return result;
}

//Gets the max key by comparing values of an object
function maxFromObject(object) {
    var maxKey = null;
    var maxValue = Number.NEGATIVE_INFINITY;

    for (var key in object) {
        var value = object[key];
        if (value > maxValue) {
            maxValue = value;
            maxKey = key;
        }
    }

    return max;
}

//I just hate typing this over and over again.
function addToComponent(vector, componentNumber, amountToAdd) {
    vector.setComponent(componentNumber, vector.getComponent(componentNumber) + amountToAdd);
}