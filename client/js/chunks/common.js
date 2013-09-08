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

function worldToChunk(wcX, wcY, wcZ) {
	if (wcZ === undefined) {
		throw "worldToChunk expects three paremeters!";
	}
	return {
		c: {
			x: Math.floor(wcX / CHUNK_WIDTH),
			y: Math.floor(wcY / CHUNK_HEIGHT),
			z: Math.floor(wcZ / CHUNK_DEPTH),
		},
		o: {
			x: mod(Math.floor(wcX), CHUNK_WIDTH),
			y: mod(Math.floor(wcY), CHUNK_HEIGHT),
			z: mod(Math.floor(wcZ), CHUNK_DEPTH),
		}
	};
}

function validChunkOffset(ocX, ocY, ocZ) {
	return ocX >= 0 && ocX < CHUNK_WIDTH &&
		ocY >= 0 && ocY < CHUNK_HEIGHT &&
		ocZ >= 0 && ocZ < CHUNK_DEPTH;
}

function ccStr(cc) {
	return cc.x + "," + cc.y + "," + cc.z;
}