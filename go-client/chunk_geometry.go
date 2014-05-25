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
	u := tileOffset[0] + uvWinding[0]
	v := tileOffset[1] + uvWinding[1]
	gc.arrayBuffer = append(gc.arrayBuffer, u, v)
}

func (gc *ChunkGeometry) Add(x, y, z float32) {
	position := []float32{x, y, z}
	for face := 0; face < 6; face++ {
		tileOffset := []float32{0, 0}
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
