package proto

import (
	"bytes"
	"fmt"
	"reflect"
	"strconv"
	"unicode"
	"unicode/utf8"

	"buildblast/server/lib/game"
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
	type_struct
	type_struct_message
)

const (
	kind_player = iota
	kind_biotic
	kind_world_item
	total_kinds
)

func firstCharLower(s string) string {
	if s == "" {
		return ""
	}
	r, n := utf8.DecodeRuneInString(s)
	return string(unicode.ToLower(r)) + s[n:]
}

// DOIT: Remove all the newlines once we know what we're doing.
func GenerateJs() string {
	var js bytes.Buffer

	js.WriteString("define(function(require){\n")
	js.WriteString("return {\n")

	// Go through each message and write the type info
	js.WriteString(`"messages": [`)
	js.WriteString("\n")
	for i := 0; i < TOTAL_MESSAGES; i++ {
		if i != 0 {
			js.WriteString(",\n")
		}
		structToJs(&js, idToMessage(MessageId(i)))
	}
	js.WriteString("]")

	// Write the type info for the interface types
	js.WriteString(`,"kinds": [`)
	for i := 0; i < total_kinds; i++ {
		if i != 0 {
			js.WriteString(",\n")
		}
		var kind interface{}
		switch i {
		case kind_player:
			kind = &game.BioticState{}
		case kind_biotic:
			kind = &game.BioticState{}
		case kind_world_item:
			kind = &game.WorldItemState{}
		default:
			panic("I don't know how to deal with this kind: " + strconv.Itoa(i))
		}
		structToJs(&js, kind)
	}
	js.WriteString("]")

	js.WriteString("}")

	js.WriteString("});")

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
		js.WriteString(firstCharLower(objValue.Type().Field(i).Name))
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
			if field.CanAddr() && typeIsMsg(field.Addr().Interface()) {
				fieldType = type_struct_message
			} else {
				fieldType = type_struct
			}
		case reflect.Interface:
			fieldType = type_interface
		default:
			panic(fmt.Sprintf("I don't know how to jsify this: %s\n", field.Kind()))
		}
		js.WriteString(strconv.Itoa(fieldType))
		if fieldType == type_struct {
			js.WriteString(`,"fields":`)
			structToJs(js, field.Interface())
		}
		js.WriteString("}\n")
	}
	js.WriteString(`]`)
}
