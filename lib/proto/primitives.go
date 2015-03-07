package proto

import (
	"encoding/binary"
	"math"
)

// We use little endian for all our server encoding.
// Our JS client (will need to) detect the hardware endianness and convert as needed.

// Returns a varint. Note: varints are encoded 7 LSBs at a time.
func MarshalInt(buf []byte, v int) int {
	return binary.PutVarint(buf, int64(v))
}

func MarshalFloat64(buf []byte, v float64) {
	bits := math.Float64bits(v)
	binary.LittleEndian.PutUint64(buf, bits)
}

func UnmarshalFloat64(buf []byte) float64 {
	bits := binary.LittleEndian.Uint64(buf)
	return math.Float64frombits(bits)
}
