package proto

import (
	"reflect"
	"fmt"
)

const (
	bufferSize = 256
)

func SerializeMessage(msg *Message) []byte {
	buf := make([]byte, 0, bufferSize)
	buf = append(buf, typeToId(msg))
	msgType := reflect.TypeOf(msg)
	if msgType.Kind() == reflect.Ptr {
		msgType = msgType.Elem()
	}
	return serializeType(buf, msgType)
}

func serializeType(buf []byte, t reflect.Type) []byte {
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		value := field.Interface()

		if typeIsMsg(value) {
			buf = append(buf, SerializeMessage(value))
		} else {
			buf = serializeField(buf, field)
		}
	}
	return buf
}

func serializeField(buf []byte, structField reflect.StructField) []byte {
	val := structField.Interface();
	switch structField.Type {
	case reflect.Uint8:
		return append(buf, val)
	case reflect.Array:
		buf = append(buf, marshalInt(len(val)))
		return append(buf, val...)
	case reflect.Int:
		return append(buf, marshalInt(int(val))...)
	case reflect.Float64:
		return append(buf, marshalFloat64(float64(val))...)
	case reflect.String:
		return append(buf, marshalString(string(val))...)
		case
	default:
		panic(fmt.Fprintf("I don't know how to serialize this: %s(%s#%s)\n",
			val.Name,
			val.Type.PkgPath,
			val.Type.Name,
		))
	}
}
