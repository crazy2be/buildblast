package proto

func (msg *MsgHandshakeReply) ToProto() []byte {
	buf := make([]byte, 256)
	buf = append(buf, MarshalInt(MSG_HANDSHAKE_REPLY))
	buf = append(buf, MarshalFloat64(msg.ServerTime))
	buf = append(buf, MarshalString(msg.ClientID))
	buf = append(buf, msg.PlayerEntityInfo.ToProto()...)
	return buf
}

func (msg *MsgHandshakeError) ToProto() []byte {
	buf := make([]byte, 256)
	buf = append(buf, MarshalInt(MSG_HANDSHAKE_ERROR))
	buf = append(buf, MarshalString(msg.Message))
	return buf;
}


