package persist

import (
	"math"
	"errors"

	"buildblast/lib/mapgen"
	"buildblast/lib/coords"
)

func deserializeChunkData(raw []byte) (*chunk, error) {
	offset := 0

	version := raw[offset]
	offset++
	if version != 1 {
		return nil, errors.New("Persist: Unrecognized chunk version.")
	}

	numSpawns := int(raw[offset])
	offset++
	spawns := make([]coords.World, numSpawns)
	for i := 0; i < numSpawns; i++ {
		spawns[i].X = readFloat64(raw, offset)
		offset += 8
		spawns[i].Y = readFloat64(raw, offset)
		offset += 8
		spawns[i].Z = readFloat64(raw, offset)
		offset += 8
	}

	data := make([]mapgen.Block, mapgen.BlocksPerChunk)
	for i := 0; i < mapgen.BlocksPerChunk; i++ {
		data[i] = mapgen.Block(raw[offset])
		offset++
	}

	return &chunk{data, spawns}, nil
}

func serializeChunkData(chunk *chunk) ([]byte, error) {
	numSpawns := len(chunk.spawns)
	if numSpawns > 255 {
		return nil, errors.New("Too many spawns (someone should fix the shitty persist code!")
	}

	raw := make([]byte, 1 + 1 + numSpawns*3*8 + mapgen.BlocksPerChunk)
	offset := 0
	raw[offset] = 1
	offset++
	raw[offset] = byte(numSpawns)
	offset++
	for i := 0; i < numSpawns; i++ {
		offset = writeFloat64(raw, offset, chunk.spawns[i].X)
		offset = writeFloat64(raw, offset, chunk.spawns[i].Y)
		offset = writeFloat64(raw, offset, chunk.spawns[i].Z)
	}
	for i := 0; i < mapgen.BlocksPerChunk; i++ {
		raw[offset] = byte(chunk.data[i])
		offset++
	}
	return raw, nil
}

func readFloat64(d []byte, offset int) float64 {
	return math.Float64frombits(
		uint64(d[offset + 0]) << (8*7) +
		uint64(d[offset + 1]) << (8*6) +
		uint64(d[offset + 2]) << (8*5) +
		uint64(d[offset + 3]) << (8*4) +
		uint64(d[offset + 4]) << (8*3) +
		uint64(d[offset + 5]) << (8*2) +
		uint64(d[offset + 6]) << (8*1) +
		uint64(d[offset + 7]) << (8*0))
}

func writeFloat64(d []byte, offset int, data float64) int {
	raw := math.Float64bits(data)
	d[offset + 0] = byte(raw >> (8*7))
	d[offset + 1] = byte(raw >> (8*6))
	d[offset + 2] = byte(raw >> (8*5))
	d[offset + 3] = byte(raw >> (8*4))
	d[offset + 4] = byte(raw >> (8*3))
	d[offset + 5] = byte(raw >> (8*2))
	d[offset + 6] = byte(raw >> (8*1))
	d[offset + 7] = byte(raw >> (8*0))
	return offset + 8
}
