package persist

import (
	"reflect"
	"testing"

	"buildblast/server/lib/coords"
	"buildblast/server/lib/mapgen"
)

func TestReadWriteFloat64(t *testing.T) {
	buf := make([]byte, 64)
	offset := 0
	offset = writeFloat64(buf, offset, 10.0)
	offset = writeFloat64(buf, offset, 20.0)
	offset = writeFloat64(buf, offset, 30.0)

	offset = 0
	ten := readFloat64(buf, offset)
	offset += 8
	twenty := readFloat64(buf, offset)
	offset += 8
	thirty := readFloat64(buf, offset)
	offset += 8

	if ten != 10.0 {
		t.Error("Did not read back 10.0 correctly. Got ", ten)
	}
	if twenty != 20.0 {
		t.Error("Did not read back 20.0 correctly. Got ", twenty)
	}
	if thirty != 30.0 {
		t.Error("Did not read back 30.0 correctly. Got ", thirty)
	}
}

func TestSerializeDeserializeChunkData(t *testing.T) {
	generator := mapgen.NewFlatWorld(0.0)
	chunk := generator.Chunk(coords.Chunk{0, 0, 0})
	in := chunk
	raw, err := serializeChunkData(in)
	if err != nil {
		t.Error(err)
	}
	out, err := deserializeChunkData(raw)
	if err != nil {
		t.Error(err)
	}
	if !reflect.DeepEqual(in, out) {
		t.Error("Deserialization did not yield original input!", in, out)
	}
}
