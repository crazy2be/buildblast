var CHUNK_WIDTH = 32;
var CHUNK_DEPTH = 32;
var CHUNK_HEIGHT = 32;

//1 is exact, 2 means 2 voxels per axis become 1, etc. So 2 reduces 'complexity' by 2^3=8, 4 by 4^3, so 64.
var CHUNK_VOXELIZATIONS = [1, 2, 4];

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