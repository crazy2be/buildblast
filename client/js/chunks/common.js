var CHUNK_WIDTH = 32;
var CHUNK_DEPTH = 32;
var CHUNK_HEIGHT = 32;
var CHUNK_QUALITIES = [1, 0.5, 0.25];

function mod(a, b) {
	return (((a % b) + b) % b);
}
function abs(n) {
	return Math.abs(n);
}
function clamp(n, a, b) {
	return Math.min(Math.max(n, a), b);
}

function worldToChunk(wx, wy, wz) {
	if (wz === undefined) {
		throw "worldToChunk expects three paremeters!";
	}
	return {
		c: {
			x: Math.floor(wx / CHUNK_WIDTH),
			y: Math.floor(wy / CHUNK_HEIGHT),
			z: Math.floor(wz / CHUNK_DEPTH),
		},
		o: {
			x: mod(Math.floor(wx), CHUNK_WIDTH),
			y: mod(Math.floor(wy), CHUNK_HEIGHT),
			z: mod(Math.floor(wz), CHUNK_DEPTH),
		}
	};
}

function validChunkOffset(ocx, ocy, ocz) {
	return ocx >= 0 && ocx < CHUNK_WIDTH &&
		ocy >= 0 && ocy < CHUNK_HEIGHT &&
		ocz >= 0 && ocz < CHUNK_DEPTH;
}

function ccStr(cc) {
	return cc.x + "," + cc.y + "," + cc.z;
}