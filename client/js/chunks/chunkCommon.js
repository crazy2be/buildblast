define(function(require){

var CHUNK = { };

CHUNK.WIDTH = 32;
CHUNK.DEPTH = 32;
CHUNK.HEIGHT = 32;

function worldToChunk(wcX, wcY, wcZ) {
	if (wcZ === undefined) {
		throw "worldToChunk expects three paremeters!";
	}
	return {
		c: {
			x: floor(wcX / CHUNK.WIDTH),
			y: floor(wcY / CHUNK.HEIGHT),
			z: floor(wcZ / CHUNK.DEPTH),
		},
		o: {
			x: mod(floor(wcX), CHUNK.WIDTH),
			y: mod(floor(wcY), CHUNK.HEIGHT),
			z: mod(floor(wcZ), CHUNK.DEPTH),
		},
	};
}

function validChunkOffset(ocX, ocY, ocZ) {
	return ocX >= 0 && ocX < CHUNK.WIDTH &&
		ocY >= 0 && ocY < CHUNK.HEIGHT &&
		ocZ >= 0 && ocZ < CHUNK.DEPTH;
}

// Same as server coords.Offset.Index()
function offsetIndex(ocX, ocY, ocZ) {
	return ocX*CHUNK.WIDTH*CHUNK.HEIGHT +
		ocY*CHUNK.WIDTH +
		ocZ;
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
	offsetIndex: offsetIndex,
	ccStr: ccStr,
}
});
