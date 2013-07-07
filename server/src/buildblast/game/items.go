package game

import (
	"fmt"

	"buildblast/mapgen"
)

type Item struct {
	kind byte
	num  byte
}

func NewItem(kind byte) Item {
	return Item{
		kind: kind,
		num: 1,
	}
}

const (
	INV_WIDTH   = 5
	INV_HEIGHT  = 5
	MAX_STACK   = 50

	ITEM_NIL    = byte(0)
	ITEM_DIRT   = byte(1)
	ITEM_STONE  = byte(2)
	ITEM_SHOVEL = byte(3)
	ITEM_GUN    = byte(4)

	// Properties
	STACKABLE = 0x1 << 0
	SHOOTABLE = 0x1 << 1

)

var ITEM_PROPERTIES []uint32 = []uint32 {
	/** NIL    */ 0,
	/** DIRT   */ STACKABLE,
	/** STONE  */ STACKABLE,
	/** SHOVEL */ 0,
	/** GUN    */ SHOOTABLE,
}

var ITEM_FROM_BLOCK []byte = []byte {
	/** NIL    */ ITEM_NIL,
	/** AIR    */ ITEM_NIL,
	/** DIRT   */ ITEM_DIRT,
	/** STRONG */ ITEM_STONE,
}

func (i Item) Stackable() bool {
	return ITEM_PROPERTIES[i.kind] & STACKABLE > 0
}

func (i Item) Shootable() bool {
	return ITEM_PROPERTIES[i.kind] & SHOOTABLE > 0
}

func ItemFromBlock(block mapgen.Block) byte {
	return ITEM_FROM_BLOCK[block]
}

func ItemsToString(items []Item) string {
	data := make([]byte, len(items) * 2)
	for i := 0; i < len(data); i += 2 {
		data[i] = toStringByte(byte(items[i / 2].kind))
		data[i + 1] = toStringByte(byte(items[i / 2].num))
	}
	return string(data)
}

func toStringByte(val byte) byte {
	// 32: Space charater. Control charaters
	// are not allowed in JSON strings.
	value := val + 32
	if (value >= 127) {
		panic(fmt.Sprintf("Attempted to encode out of range value of '%d' to item data. (It might work but we need to test it)", value))
	}
	return value
}