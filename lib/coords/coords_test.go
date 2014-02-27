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

// These functions benchmark the relative speed of different ways
// of iterating through all the blocks in a chunk.

func BenchmarkEveryOffset(b *testing.B) {
	for i := 0; i < b.N; i++ {
		j := 0
		for oc := range EveryOffset() {
			j2 := oc.Index()
			if j != j2 {
				println("Error")
			}
			j++
		}
	}
}

func BenchmarkEachOffset(b *testing.B) {
	for i := 0; i < b.N; i++ {
		j := 0
		EachOffset(func(oc Offset) {
			j2 := oc.Index()
			if j != j2 {
				println("Error")
			}
			j++
		})
	}
}

func BenchmarkForLoopOffset(b *testing.B) {
	for i := 0; i < b.N; i++ {
		j := 0
		for ocX := 0; ocX < ChunkWidth; ocX++ {
			for ocY := 0; ocY < ChunkHeight; ocY++ {
				for ocZ := 0; ocZ < ChunkDepth; ocZ++ {
					j2 := Offset{X: ocX, Y: ocY, Z: ocZ}.Index()
					if j != j2 {
						println("Error")
					}
					j++
				}
			}
		}
	}
}

func BenchmarkForLoopIndexOffset(b *testing.B) {
	for i := 0; i < b.N; i++ {
		for j := 0; j < BlocksPerChunk; j++ {
			oc := IndexOffset(j)
			j2 := oc.Index()
			if j != j2 {
				println("Error")
			}
		}
	}
}
