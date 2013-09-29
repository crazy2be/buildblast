define([], function() {

	var CHUNK = { };

	CHUNK.WIDTH = 32;
	CHUNK.DEPTH = 32;
	CHUNK.HEIGHT = 32;

	//1 is exact, 2 means 2 voxels per axis become 1, etc. So 2 reduces 'complexity' by 2^3=8, 4 by 4^3, so 64.
	CHUNK.VOXELIZATIONS = [1, 2, 4];

	function worldToChunk(wcX, wcY, wcZ) {
		if (wcZ === undefined) {
			throw "worldToChunk expects three paremeters!";
		}
		return {
			c: {
				x: Math.floor(wcX / CHUNK.WIDTH),
				y: Math.floor(wcY / CHUNK.HEIGHT),
				z: Math.floor(wcZ / CHUNK.DEPTH),
			},
			o: {
				x: mod(Math.floor(wcX), CHUNK.WIDTH),
				y: mod(Math.floor(wcY), CHUNK.HEIGHT),
				z: mod(Math.floor(wcZ), CHUNK.DEPTH),
			},
		};
	}

	function validChunkOffset(ocX, ocY, ocZ) {
		return ocX >= 0 && ocX < CHUNK.WIDTH &&
			ocY >= 0 && ocY < CHUNK.HEIGHT &&
			ocZ >= 0 && ocZ < CHUNK.DEPTH;
	}

	function ccStr(cc) {
		return cc.x + "," + cc.y + "," + cc.z;
	}

	return {
		//Chunk constants, would be nice if it was just static members
		//of Chunk but this is javascript so...
		CHUNK: CHUNK,
		worldToChunk: worldToChunk,
		validChunkOffset: validChunkOffset,
		ccStr: ccStr,
	}
});