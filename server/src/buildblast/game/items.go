package game

import (
	"fmt"
)

type Item byte

const (
	INV_WIDTH   = 5
	INV_HEIGHT  = 5

	ITEM_NIL    = Item(0)
	ITEM_DIRT   = Item(1)
	ITEM_STONE  = Item(2)
	ITEM_SHOVEL = Item(3)
	ITEM_GUN    = Item(4)

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

func (i Item) Stackable() bool {
	return ITEM_PROPERTIES[i] & STACKABLE > 0
}

func (i Item) Shootable() bool {
	return ITEM_PROPERTIES[i] & SHOOTABLE > 0
}

func ItemsToString(items []Item) string {
	data := make([]byte, len(items))
	for i := 0; i < len(data); i++ {
		// 32: Space charater. Control charaters
		// are not allowed in JSON strings.
		value := byte(items[i] + 32)
		data[i] = value
		if (value >= 127) {
			panic(fmt.Sprintf("Attempted to encode out of range value of '%d' to item data. (It might work but we need to test it)", value))
		}
	}
	return string(data)
}
