package proto

import (
	"encoding/binary"
	"math"
)

// We use big endian for all our network traffic.
// Our JS client (will need to) detect the hardware endianness and convert as needed.

// Returns a varint. Note: varints are encoded 7 LSBs at a time.
func MarshalInt(buf []byte, v int) int {
	return binary.PutVarint(buf, int64(v))
}

func MarshalFloat64(buf []byte, v float64) {
	bits := math.Float64bits(v)
	binary.BigEndian.PutUint64(buf, bits)
}

func UnmarshalFloat64(buf []byte) float64 {
	bits := binary.BigEndian.Uint64(buf)
	return math.Float64frombits(bits)
}
