//cc is just a vector giving the chunk coords.
//blocks is the raw block array, filled with block types.
//quality is a value describing the 'voxelization', lower values mean more pixelation.

//This is basically just POD, the meshers do all the heavy lifting.
function ChunkGeometry(cc, blocks, manager, chunkMesher) {
    var self = this;

    chunkMesher = chunkMesher || greedyMesher;

    var cw = CHUNK_WIDTH;
    var ch = CHUNK_HEIGHT;
    var cd = CHUNK_DEPTH;

    self.blocks = blocks;
    self.cc = cc;
    self.priority = 1;
    self.shown = true;
    self.changed = true;
    self.loaded = false;
    self.quality = 1;

    self.calculateGeometries = function () {
        var geometries = [];
        var transferables = [];

        var originalQuality = self.quality;
        CHUNK_QUALITIES.forEach(function (quality) {
            self.quality = quality;

            var geometry = { };

            var res = chunkMesher(self, manager);

            geometry.attributes = res.attributes;
            geometry.offsets = res.offsets;

            geometries.push(geometry);
            transferables.concat(res.transferables);
        });
        self.quality = originalQuality;

        return {
            geometries: geometries,
            transferables: transferables,
        };
    }

    self.block = function block(ox, oy, oz) {
        if (validChunkOffset(ox, oy, oz)) {
            return blocks[ox*cw*ch + oy*cw + oz];
        } else {
            throw "Invalid offset coords!";
        }
    };

    //Call .block before this to insure the block coords.
    self.setBlock = function setBlock(ox, oy, oz, type) {
        if (validChunkOffset(ox, oy, oz)) {
            blocks[ox*cw*ch + oy*cw + oz] = type;
        } else {
            throw "Invalid offset coords!";
        }
    };
}
