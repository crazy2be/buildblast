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

var blockToItem map[mapgen.Block]Item

func (item Item) Stackable() bool {
	return ITEM_PROPERTIES[item]&STACKABLE != 0
}

func (item Item) Shootable() bool {
	return ITEM_PROPERTIES[item]&SHOOTABLE != 0
}

func ItemFromBlock(block mapgen.Block) Item {
	return blockToItem[block]
}

func init() {
	blockToItem = make(map[mapgen.Block]Item, 2)
	blockToItem[mapgen.BLOCK_DIRT] = ITEM_DIRT
	blockToItem[mapgen.BLOCK_STONE] = ITEM_STONE
	// All others are ITEM_NIL by default
}
