package proto

import (
	"fmt"
	"reflect"
)

const (
	bufferSize = 256
)

func SerializeMessage(msg Message) []byte {
	buf := make([]byte, 0, bufferSize)
	buf = append(buf, byte(typeToId(msg)))
	msgValue := reflect.ValueOf(msg)
	return serializeFields(buf, msgValue)
}

func serializeFields(buf []byte, v reflect.Value) []byte {
	// Follow any references to the actual struct objects.
	for v.Kind() == reflect.Ptr || v.Kind() == reflect.Interface {
		v = v.Elem()
	}
	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		value := field.Addr().Interface()

		if typeIsMsg(value) {
			buf = append(buf, SerializeMessage(Message(value))...)
		} else {
			buf = serializeField(buf, field)
		}
	}
	return buf
}

func serializeField(buf []byte, v reflect.Value) []byte {
	switch v.Kind() {
	case reflect.Uint8:
		return append(buf, byte(v.Uint()))
	case reflect.Slice:
		switch val := v.Interface().(type) {
		case []byte:
			buf = append(buf, marshalInt(len(val))...)
			return append(buf, val...)
		default:
			panic(fmt.Sprintf("I don't support serializing this slice: %s\n",
				reflect.TypeOf(v.Interface())))
		}
	case reflect.Int:
		return append(buf, marshalInt(int(v.Int()))...)
	case reflect.Float64:
		return append(buf, marshalFloat64(v.Float())...)
	case reflect.String:
		return append(buf, marshalString(v.String())...)
	case reflect.Bool:
		byteVal := byte(0)
		if v.Bool() {
			byteVal = 1
		} else {
			byteVal = 0
		}
		return append(buf, byteVal)
	case reflect.Ptr, reflect.Interface, reflect.Struct:
		return serializeFields(buf, v)
	default:
		panic(fmt.Sprintf("I don't know how to serialize this: %s, %s, %s\n",
			v.Kind(),
			reflect.TypeOf(v.Interface()),
			v.Interface()))
	}
}

func DeserializeMessage(buf []byte) Message {
	msg := idToMessage(MessageId(buf[0]))
	msgValue := reflect.ValueOf(msg)
	deserializeFields(buf[1:], msgValue)
	return msg
}

func deserializeFields(buf []byte, v reflect.Value) []byte {
	// Follow any references to the actual struct objects.
	for (v.Kind() == reflect.Ptr || v.Kind() == reflect.Interface) && v.Elem().IsValid() {
		v = v.Elem()
	}
	for i := 0; i < v.NumField(); i++ {
		buf = deserializeField(buf, v.Field(i))
	}
	return buf
}

func deserializeField(buf []byte, v reflect.Value) []byte {
	switch v.Kind() {
	case reflect.Uint8:
		v.SetUint(uint64(buf[0]))
		return buf[1:]
	case reflect.Slice:
		switch val := v.Addr().Interface().(type) {
		case *[]byte:
			length, read := unmarshalInt(buf)
			*val = buf[:length]
			return buf[int(length)+read:]
		default:
			panic(fmt.Sprintf("I don't support deserializing this slice: %s\n",
				reflect.TypeOf(v.Interface())))
		}
	case reflect.Int:
		value, read := unmarshalInt(buf)
		v.SetInt(value)
		return buf[read:]
	case reflect.Float64:
		value, read := unmarshalFloat64(buf)
		v.SetFloat(value)
		return buf[read:]
	case reflect.String:
		value, read := unmarshalString(buf)
		v.SetString(value)
		return buf[read:]
	case reflect.Struct, reflect.Interface:
		return deserializeFields(buf, v)
	default:
		panic(fmt.Sprintf("I don't know how to deserialize this: %s, %s, %s\n",
			v.Kind(),
			reflect.TypeOf(v.Interface()),
			v.Interface()))
	}
}

func printBuf(buf []byte) {
	for _, b := range buf {
		var i byte
		for i = 7; i < 8; i-- {
			fmt.Printf("%d", (b>>i)&1)
		}
		fmt.Printf(" ")
	}
	fmt.Println()
}
