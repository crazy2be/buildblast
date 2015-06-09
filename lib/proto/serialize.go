package proto

import (
	"reflect"
	"fmt"

	"buildblast/lib/game"
	"buildblast/lib/coords"
	"buildblast/lib/vmath"
	"buildblast/lib/mapgen"
	"buildblast/lib/physics"
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
	switch val := v.Interface().(type) {
	case byte:
		return append(buf, val)
	case game.EntityKind:
		return append(buf, byte(val))
	case mapgen.Block:
		return append(buf, byte(val))
	case game.Item:
		return append(buf, byte(val))
	case []byte:
		buf = append(buf, marshalInt(len(val))...)
		return append(buf, val...)
	case int:
		return append(buf, marshalInt(val)...)
	case float64:
		return append(buf, marshalFloat64(val)...)
	case string:
		return append(buf, marshalString(val)...)
	case game.EntityId:
		return append(buf, marshalString(string(val))...)
	case bool:
		byteVal := byte(0)
		if val {
			byteVal = 1
		} else {
			byteVal = 0
		}
		return append(buf, byteVal)
	case coords.World, coords.Chunk, coords.Offset, coords.Block, coords.Direction, vmath.Vec3,
			physics.Body, game.EntityState, game.Health, *game.BioticState:
		return append(buf, serializeFields(buf, v)...)
	default:
		panic(fmt.Sprintf("I don't know how to serialize this: %s, %s", val, reflect.TypeOf(val)))
	}
}

func DeserializeMessage(buf []byte) (Message, error) {
	buf = nil
	return nil, nil
}
