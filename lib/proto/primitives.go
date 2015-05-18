package proto

import (
	"encoding/binary"
	"math"
)

// We use big endian for all our network traffic.
// Our JS client (will need to) detect the hardware endianness and convert as needed.

// Returns a varint. Note: varints are encoded 7 LSBs at a time.
func MarshalInt(v int) []byte {
	buf := make([]byte, 10) // Maximum size is 10 bytes
	written := binary.PutVarint(buf, int64(v))
	return buf[:written]
}

func UnmarshalInt(buf []byte) (int64, int) {
	return binary.Varint(buf)
}

func MarshalFloat64(v float64) []byte {
	buf := make([]byte, 8)
	bits := math.Float64bits(v)
	binary.BigEndian.PutUint64(buf, bits)
	return buf
}

func UnmarshalFloat64(buf []byte) (float64, int) {
	bits := binary.BigEndian.Uint64(buf)
	return math.Float64frombits(bits), 8
}

func MarshalString(s string) []byte {
	buf := make([]byte, 0, 10+len(s))
	buf = append(buf, MarshalInt(len(s))...)
	return append(buf, s...)
}

func UnmarshalString(buf []byte) (string, int) {
	strLen, read := UnmarshalInt(buf)
	totalBytes := int(strLen) + read
	return string(buf[read:totalBytes]), totalBytes
}
