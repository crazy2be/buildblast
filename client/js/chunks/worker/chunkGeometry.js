//cc is just a vector giving the chunk coords.
//blocks is the raw block array, filled with block types.
//quality is a value describing the 'pixelation', lower values mean more pixelation.

//This is basically just POD, the meshers do all the heavy lifting.
function ChunkGeometry(cc, blocks, manager) {
    var self = this;

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

            var meshFunction = settings.greedyMesh ? greedyMesh : simpleMesh;

            var geometry = { };

            var res = meshFunction(self, manager);

            geometry.attributes = res.attributes;
            geometry.offsets = res.offsets;

            if(settings.testingMesher) {
                geometry.testData = { };
                var resGreedy = greedyMesh(self, manager);
                var resSimple = simpleMesh(self, manager);

                geometry.testData.greedy = { };
                geometry.testData.simple = { };

                geometry.testData.greedy.verticeCount = resGreedy.attributes.position.numItems;
                geometry.testData.simple.verticeCount = resSimple.attributes.position.numItems;
            }

            geometries.push(geometry);
            transferables.concat(res.transferables);
        });
        self.quality = originalQuality;

        return {
            geometries: geometries,
            transferables: transferables,
        };
    }

    //The greedy mesher is a lot simplier if Chunk and ChunkGeometry both expose
    //getQuality and block.
    self.getQuality = function() {
        return self.quality;
    }

    self.block = function block(ox, oy, oz) {
        if (validChunkOffset(ox, oy, oz)) {
            return blocks[ox*cw*ch + oy*cw + oz];
        }
        return null;
    };

    //Call .block before this to insure the block coords.
    self.setBlock = function setBlock (ox, oy, oz, type) {
        if (validChunkOffset(ox, oy, oz)) {
            blocks[ox*cw*ch + oy*cw + oz] = type;
        } else {
            throw "Invalid offset coords!";
        }
    };
}
