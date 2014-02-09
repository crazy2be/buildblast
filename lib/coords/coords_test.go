package coords

import (
	"testing"
)

func TestIndexOffset(t *testing.T) {
	oc1 := IndexOffset(0)
	expected1 := Offset{X: 0, Y: 0, Z: 0}
	if oc1 != expected1 {
		t.Error("Got ", oc1, " expected ", expected1)
	}

	oc2 := IndexOffset(BlocksPerChunk - 1)
	expected2 := Offset{
		X: ChunkWidth - 1,
		Y: ChunkHeight - 1,
		Z: ChunkDepth - 1,
	}
	if oc2 != expected2 {
		t.Error("Got ", oc2, " expected ", expected2)
	}

	for i := 0; i < BlocksPerChunk; i++ {
		oc := IndexOffset(i)
		i2 := oc.Index()
		if i != i2 {
			t.Error("Got ", i2, " expected ", i, " for offset ", oc)
		}
	}

	i := 0
	for oc := range EveryOffset() {
		i2 := oc.Index()
		if i != i2 {
			t.Error("Got ", i2, " expected ", i, " for offset ", oc)
		}
		i++
	}
	if i != BlocksPerChunk {
		t.Error("EveryOffset did not give every offset!", i)
	}
}
