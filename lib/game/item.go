package game

import (
	"buildblast/lib/mapgen"
)

type Item byte

const (
	ITEM_NIL = Item(iota)
	ITEM_DIRT
	ITEM_STONE
	ITEM_SHOVEL
	ITEM_GUN
)

const (
	// Properties
	STACKABLE = 0x1 << iota
	SHOOTABLE
)

var ITEM_PROPERTIES []uint32 = []uint32{
	/** NIL    */ 0,
	/** DIRT   */ STACKABLE,
	/** STONE  */ STACKABLE,
	/** SHOVEL */ 0,
	/** GUN    */ SHOOTABLE,
}

var ITEM_FROM_BLOCK []Item = []Item{
	/** NIL    */ ITEM_NIL,
	/** AIR    */ ITEM_NIL,
	/** DIRT   */ ITEM_DIRT,
	/** STONE  */ ITEM_STONE,
}

func (item Item) Stackable() bool {
	return ITEM_PROPERTIES[item]&STACKABLE != 0
}

func (item Item) Shootable() bool {
	return ITEM_PROPERTIES[item]&SHOOTABLE != 0
}

func ItemFromBlock(block mapgen.Block) Item {
	return ITEM_FROM_BLOCK[block]
}
