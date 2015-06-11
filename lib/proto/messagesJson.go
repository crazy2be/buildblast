package proto

import (
	"buildblast/lib/coords"
	"bytes"
	"fmt"
	"reflect"
	"strconv"
)

const (
	type_unknown = iota
	type_byte
	type_slice
	type_int
	type_float64
	type_string
	type_bool
	type_interface
	type_struct_message
	type_struct_vec_int
	type_struct_vec_float64
)

func GenerateJs() string {
	var js bytes.Buffer

	js.WriteString("define(function(require){ return {\n")

	// Go through each message and write the type info
	js.WriteString(`"messages":[`)
	js.WriteString("\n")
	for i := 0; i < TOTAL_MESSAGES; i++ {
		if i != 0 {
			js.WriteString(",\n")
		}
		structToJs(&js, idToMessage(MessageId(i)))
	}
	js.WriteString("]")

	js.WriteString("}; });")

	return js.String()
}

func structToJs(js *bytes.Buffer, obj interface{}) {
	js.WriteString("[\n")
	objValue := reflect.ValueOf(obj)

	// Follow any references to the actual struct objects.
	for objValue.Kind() == reflect.Ptr || objValue.Kind() == reflect.Interface {
		objValue = objValue.Elem()
	}

	for i := 0; i < objValue.NumField(); i++ {
		if i != 0 {
			js.WriteString(",")
		}
		field := objValue.Field(i)
		js.WriteString(`{"name":"`)
		js.WriteString(objValue.Type().Field(i).Name)
		js.WriteString(`","type":`)
		var fieldType int
		switch field.Kind() {
		case reflect.Uint8:
			fieldType = type_byte
		case reflect.Slice:
			fieldType = type_slice
		case reflect.Int:
			fieldType = type_int
		case reflect.Float64:
			fieldType = type_float64
		case reflect.String:
			fieldType = type_string
		case reflect.Bool:
			fieldType = type_bool
		case reflect.Struct:
			if typeIsMsg(field.Addr().Interface()) {
				fieldType = type_struct_message
			} else {
				switch field.Interface().(type) {
				case coords.Size, coords.Chunk, coords.Block:
					fieldType = type_struct_vec_int
				case coords.World:
					fieldType = type_struct_vec_float64
				default:
					// Mainly used with MsgControlsState. They client never has to decode this
					// message, and uses non-generated code to encode it.
					fieldType = type_unknown
				}
			}
		case reflect.Interface:
			fieldType = type_interface
		default:
			panic(fmt.Sprintf("I don't know how to jsify this: %s\n", field.Kind()))
		}
		js.WriteString(strconv.Itoa(fieldType))
		js.WriteString("}\n")
	}
	js.WriteString(`]`)
}
