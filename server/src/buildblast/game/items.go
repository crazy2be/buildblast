package game

import (
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
	ITEM_NIL    = byte(0)
	ITEM_DIRT   = byte(1)
	ITEM_STONE  = byte(2)
	ITEM_SHOVEL = byte(3)
	ITEM_GUN    = byte(4)
	ITEM_LIGHT  = byte(5)

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
	/** LIGHT  */ 0,
}

var ITEM_FROM_BLOCK []byte = []byte {
	/** NIL    */ ITEM_NIL,
	/** AIR    */ ITEM_NIL,
	/** DIRT   */ ITEM_DIRT,
	/** STONE  */ ITEM_STONE,
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
