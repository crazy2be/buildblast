var CHUNK_WIDTH = 32;
var CHUNK_DEPTH = 32;
var CHUNK_HEIGHT = 32;

function mod(a, b) {
    return (((a % b) + b) % b);
}

function worldToChunk(wx, wy, wz) {
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

function validChunkOffset(ox, oy, oz) {
    return ox >= 0 && ox < CHUNK_WIDTH &&
        oy >= 0 && oy < CHUNK_HEIGHT &&
        oz >= 0 && oz < CHUNK_DEPTH;
}

function ccStr(cc) {
    return cc.x + "," + cc.y + "," + cc.z;
}
