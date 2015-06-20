package persist

import (
	"errors"
	"math"

	"buildblast/server/lib/coords"
	"buildblast/server/lib/mapgen"
)

func deserializeChunkData(raw []byte) (*mapgen.Chunk, error) {
	offset := 0

	version := raw[offset]
	offset++
	if version != 1 {
		return nil, errors.New("Persist: Unrecognized chunk version.")
	}

	chunk := &mapgen.Chunk{}
	for i := 0; i < coords.BlocksPerChunk; i++ {
		chunk.SetBlock(coords.IndexOffset(i), mapgen.Block(raw[offset]))
		offset++
	}

	return chunk, nil
}

func serializeChunkData(chunk *mapgen.Chunk) ([]byte, error) {
	raw := make([]byte, 1+coords.BlocksPerChunk)
	offset := 0

	raw[offset] = 1 // version
	offset++

	for i := 0; i < coords.BlocksPerChunk; i++ {
		raw[offset] = byte(chunk.Block(coords.IndexOffset(i)))
		offset++
	}
	return raw, nil
}

// Leaving these here, because we are likely to want them in the
// future (for entity position persist and such, if someone wants
// to write it).
func readFloat64(d []byte, offset int) float64 {
	return math.Float64frombits(
		uint64(d[offset+0])<<(8*7) |
			uint64(d[offset+1])<<(8*6) |
			uint64(d[offset+2])<<(8*5) |
			uint64(d[offset+3])<<(8*4) |
			uint64(d[offset+4])<<(8*3) |
			uint64(d[offset+5])<<(8*2) |
			uint64(d[offset+6])<<(8*1) |
			uint64(d[offset+7])<<(8*0))
}

func writeFloat64(d []byte, offset int, data float64) int {
	raw := math.Float64bits(data)
	d[offset+0] = byte(raw >> (8 * 7))
	d[offset+1] = byte(raw >> (8 * 6))
	d[offset+2] = byte(raw >> (8 * 5))
	d[offset+3] = byte(raw >> (8 * 4))
	d[offset+4] = byte(raw >> (8 * 3))
	d[offset+5] = byte(raw >> (8 * 2))
	d[offset+6] = byte(raw >> (8 * 1))
	d[offset+7] = byte(raw >> (8 * 0))
	return offset + 8
}
