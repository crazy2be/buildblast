package main

var VERTEX_POSITIONS [][][]float32 = [][][]float32{
 	{ { 1, 0, 0 }, { 1, 1, 0 }, { 1, 1, 1 }, { 1, 0, 1 }, {   1, 0.5, 0.5 } },
 	{ { 0, 0, 1 }, { 0, 1, 1 }, { 0, 1, 0 }, { 0, 0, 0 }, {   0, 0.5, 0.5 } },
 	{ { 0, 1, 1 }, { 1, 1, 1 }, { 1, 1, 0 }, { 0, 1, 0 }, { 0.5,   1, 0.5 } },
 	{ { 0, 0, 0 }, { 1, 0, 0 }, { 1, 0, 1 }, { 0, 0, 1 }, { 0.5,   0, 0.5 } },
 	{ { 0, 0, 1 }, { 1, 0, 1 }, { 1, 1, 1 }, { 0, 1, 1 }, { 0.5, 0.5,   1 } },
 	{ { 0, 1, 0 }, { 1, 1, 0 }, { 1, 0, 0 }, { 0, 0, 0 }, { 0.5, 0.5,   0 } },
};

var UV_WINDING [][][]float32 = [][][]float32{
 	{ { 1, 0 }, { 1, 1 }, { 0, 1 }, { 0, 0 }, { 0.5, 0.5 } },
 	{ { 1, 0 }, { 1, 1 }, { 0, 1 }, { 0, 0 }, { 0.5, 0.5 } },
 	{ { 0, 0 }, { 1, 0 }, { 1, 1 }, { 0, 1 }, { 0.5, 0.5 } },
 	{ { 1, 1 }, { 0, 1 }, { 0, 0 }, { 1, 0 }, { 0.5, 0.5 } },
 	{ { 0, 0 }, { 1, 0 }, { 1, 1 }, { 0, 1 }, { 0.5, 0.5 } },
 	{ { 1, 1 }, { 0, 1 }, { 0, 0 }, { 1, 0 }, { 0.5, 0.5 } },
};

var ATLAS [][]float32 = [][]float32{
	{0, 7}, // Dirt / Grass bottom
	{1, 7}, // Grass side
	{2, 7}, // Grass top
	{3, 7}, // Stone
	{4, 7}, // Spawn
	{5, 7}, // Coal
	{6, 7}, // Iron
	{7, 7}, // Gold
	{0, 6}, // Sapphire
	{1, 6}, // Emerald
	{2, 6}, // Ruby
	{3, 6}, // Diamond
	{4, 6}, // Poudretteite
	{5, 6}, // Glass
}

var ATLAS_SIZE float32 = 128
var TILE_SIZE float32 = 16
var UV_UNIT float32 = TILE_SIZE / ATLAS_SIZE

var TEXTURE_MAP [][]int = [][]int {
	/** NIL          */ {-1, -1, -1, -1, -1, -1},
	/** AIR          */ {-1, -1, -1, -1, -1, -1},
	/** DIRT         */ {0, 0, 0, 0, 0, 0},
	/** STONE        */ {3, 3, 3, 3, 3, 3},
	/** SPAWN        */ {4, 4, 4, 4, 4, 4},
	/** GRASS        */ {1, 1, 2, 0, 1, 1},
	/** COAL         */ {5, 5, 5, 5, 5, 5},
	/** IRON         */ {6, 6, 6, 6, 6, 6},
	/** GOLD         */ {7, 7, 7, 7, 7, 7},
	/** SAPPHIRE     */ {8, 8, 8, 8, 8, 8},
	/** EMERALD      */ {9, 9, 9, 9, 9, 9},
	/** RUBY         */ {10, 10, 10, 10, 10, 10},
	/** DIAMOND      */ {11, 11, 11, 11, 11, 11},
	/** POUDRETTEITE */ {12, 12, 12, 12, 12, 12},
	/** GLASS        */ {13, 13, 13, 13, 13, 13},
}

type ChunkGeometry struct {
	numVerts int
	arrayBuffer []float32
	elementArrayBuffer []uint16
}

func NewChunkGeometry() *ChunkGeometry {
	return &ChunkGeometry{
		0,
		make([]float32, 0),
		make([]uint16, 0),
	}
}

func (gc *ChunkGeometry) buildFace(face int) {
	var l = uint16(gc.numVerts);
	gc.elementArrayBuffer = append(gc.elementArrayBuffer, l-4, l-3, l-1)
	gc.elementArrayBuffer = append(gc.elementArrayBuffer, l-3, l-2, l-1)
}

func (gc *ChunkGeometry) buildUv(tileOffset, uvWinding []float32) {
	u := (tileOffset[0] + uvWinding[0])/8.0
	v := (tileOffset[1] + uvWinding[1])/8.0
	gc.arrayBuffer = append(gc.arrayBuffer, u, v)
}

func (gc *ChunkGeometry) Add(blockType int, x, y, z float32) {
	position := []float32{x, y, z}
	for face := 0; face < 6; face++ {
		tileOffset := ATLAS[TEXTURE_MAP[blockType][face]]
		for vert := 0; vert < 4; vert++ {
			for comp := 0; comp < 3; comp++ {
				gc.arrayBuffer = append(gc.arrayBuffer,
					position[comp] + VERTEX_POSITIONS[face][vert][comp])
			}
			gc.buildUv(tileOffset, UV_WINDING[face][vert])
			gc.numVerts++
		}
		gc.buildFace(face)
	}
}
