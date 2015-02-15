package main

import (
	"github.com/go-gl/gl"
)

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
	vertexArray []float32
	indexArray []uint16
}

func NewChunkGeometry() *ChunkGeometry {
	return &ChunkGeometry{
		0,
		make([]float32, 0),
		make([]uint16, 0),
	}
}

func (gc *ChunkGeometry) push(n ...float32) {
	gc.vertexArray = append(gc.vertexArray, n...)
}

func (gc *ChunkGeometry) pushIndex(n ...uint16) {
	gc.indexArray = append(gc.indexArray, n...)
}

func (gc *ChunkGeometry) buildFace(face int) {
	var l = uint16(gc.numVerts);
	gc.pushIndex(l-4, l-3, l-1)
	gc.pushIndex(l-3, l-2, l-1)
}

func (gc *ChunkGeometry) buildUv(tileOffset, uvWinding []float32) {
	u := (tileOffset[0] + uvWinding[0]) * UV_UNIT
	v := (tileOffset[1] + uvWinding[1]) * UV_UNIT
	// Add a 12.5% texel inset at the edges, to prevent rounding artifacts.
	u += (-(uvWinding[0] - 0.5)*2) / (ATLAS_SIZE * 8);
	v += (-(uvWinding[1] - 0.5)*2) / (ATLAS_SIZE * 8);
	gc.push(u, v)
}

func (gc *ChunkGeometry) Add(blockType int, position []float32, shownFaces []bool) {
	for face := 0; face < 6; face++ {
		if !shownFaces[face] {
			continue
		}
		tileOffset := ATLAS[TEXTURE_MAP[blockType][face]]
		for vert := 0; vert < 4; vert++ {
			for comp := 0; comp < 3; comp++ {
				gc.push(position[comp] + VERTEX_POSITIONS[face][vert][comp])
			}
			gc.buildUv(tileOffset, UV_WINDING[face][vert])
			gc.numVerts++
		}
		gc.buildFace(face)
	}
}

type ChunkMesh struct {
	vertexBuffer gl.Buffer
	indexBuffer gl.Buffer
	numIndices int
	matrix Matrix
}

func NewChunkMesh(gc *ChunkGeometry) *ChunkMesh {
	return &ChunkMesh{
		vertexBuffer: make_buffer(gl.ARRAY_BUFFER, len(gc.vertexArray)*4, gc.vertexArray),
		indexBuffer: make_buffer(gl.ELEMENT_ARRAY_BUFFER, len(gc.indexArray)*2, gc.indexArray),
		numIndices: len(gc.indexArray),
	}
}

func (cm *ChunkMesh) Draw(program gl.Program) {
	cm.vertexBuffer.Bind(gl.ARRAY_BUFFER)

	position := program.GetAttribLocation("position")
	position.AttribPointer(3, gl.FLOAT, false, 4*5, uintptr(0))
	position.EnableArray()

	uv := program.GetAttribLocation("uv")
	uv.AttribPointer(2, gl.FLOAT, false, 4*5, uintptr(4*3))
	uv.EnableArray()

	cm.indexBuffer.Bind(gl.ELEMENT_ARRAY_BUFFER)
	gl.DrawElements(gl.TRIANGLES, cm.numIndices, gl.UNSIGNED_SHORT, nil)

	uv.DisableArray()
	position.DisableArray()
}

type ChunkManager struct {
}

func (cm *ChunkManager) ChunkAt(cc coords.Chunk) *mapgen.Chunk {
	return nil
}

func MeshChunk(chunk mapgen.Chunk, cc coords.Chunk, manager ChunkManager) *ChunkGeometry {
	cg := NewChunkGeometry()

	pxc := manager.ChunkAt(cc.X + 1, cc.Y, cc.Z);
	nxc := manager.ChunkAt(cc.X - 1, cc.Y, cc.Z);
	pyc := manager.ChunkAt(cc.X, cc.Y + 1, cc.Z);
	nyc := manager.ChunkAt(cc.X, cc.Y - 1, cc.Z);
	pzc := manager.ChunkAt(cc.X, cc.Y, cc.Z + 1);
	nzc := manager.ChunkAt(cc.X, cc.Y, cc.Z - 1);

	transparent := func (ocX, ocY, ocZ float32) {
		if (ocX < 0) {
			return nxc ? trans(nxc.Block(cw - 1, ocY, ocZ)) : false;
		} else if (ocX >= cw) {
			return pxc ? trans(pxc.Block(0, ocY, ocZ)) : false;
		} else if (ocY < 0) {
			return nyc ? trans(nyc.Block(ocX, ch - 1, ocZ)) : false;
		} else if (ocY >= ch) {
			return pyc ? trans(pyc.Block(ocX, 0, ocZ)) : false;
		} else if (ocZ < 0) {
			return nzc ? trans(nzc.Block(ocX, ocY, cd - 1)) : false;
		} else if (ocZ >= cd) {
			return pzc ? trans(pzc.Block(ocX, ocY, 0)) : false;
		} else {
			return trans(blocks[ocX*cw*ch + ocY*cw + ocZ]);
		}
	}

	chunk.Each(func (oc coords.Offset, block mapgen.Block) {
		if block == mapgen.BLOCK_AIR {
			return
		}
		shownFaces := []bool{
			transparent(oc.X + 1, oc.Y,     oc.Z    ),
			transparent(oc.X - 1, oc.Y,     oc.Z    ),
			transparent(oc.X,     oc.Y + 1, oc.Z    ),
			transparent(oc.X,     oc.Y - 1, oc.Z    ),
			transparent(oc.X,     oc.Y,     oc.Z + 1),
			transparent(oc.X,     oc.Y,     oc.Z - 1)
		}
		position := []float32{
			oc.X + cc.X*mapgen.ChunkWidth,
			oc.Y + cc.Y*mapgen.ChunkHeight,
			oc.Z + cc.Z*mapgen.ChunkDepth,
		}
		cg.Add(block, position, shownFaces)
	})
	return cg
}
