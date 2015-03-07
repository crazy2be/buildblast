package proto

type Proto interface {
	ToProto() []byte
	FromProto(buf []byte) (int, error)
}
