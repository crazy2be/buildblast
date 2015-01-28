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
	ITEM_SPAWN
	ITEM_GRASS
	ITEM_COAL
	ITEM_IRON
	ITEM_GOLD
	ITEM_SAPPHIRE
	ITEM_EMERALD
	ITEM_RUBY
	ITEM_DIAMOND
	ITEM_POUDRETTEITE
	ITEM_GLASS

	// Keep this last
	TOTAL_ITEMS
)

const (
	// Properties
	STACKABLE = 0x1 << iota
	SHOOTABLE
)

var ITEM_PROPERTIES []uint32 = []uint32{
	/** NIL          */ 0,
	/** DIRT         */ STACKABLE,
	/** STONE        */ STACKABLE,
	/** SHOVEL       */ 0,
	/** GUN          */ SHOOTABLE,
	/** SPAWN        */ STACKABLE,
	/** GRASS        */ STACKABLE,
	/** COAL         */ STACKABLE,
	/** IRON         */ STACKABLE,
	/** GOLD         */ STACKABLE,
	/** SAPPHIRE     */ STACKABLE,
	/** EMERALD      */ STACKABLE,
	/** RUBY         */ STACKABLE,
	/** DIAMOND      */ STACKABLE,
	/** POUDRETTEITE */ STACKABLE,
	/** GLASS        */ STACKABLE,
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

func EveryItem() chan Item {
	results := make(chan Item, TOTAL_ITEMS)
	go func() {
		for i := int(ITEM_DIRT); i < len(ITEM_PROPERTIES); i++ {
			results <- Item(i)
		}
		close(results)
	}()
	return results
}

func init() {
	blockToItem = make(map[mapgen.Block]Item, 2)
	blockToItem[mapgen.BLOCK_DIRT] = ITEM_DIRT
	blockToItem[mapgen.BLOCK_STONE] = ITEM_STONE
	blockToItem[mapgen.BLOCK_SPAWN] = ITEM_SPAWN
	blockToItem[mapgen.BLOCK_GRASS] = ITEM_GRASS
	blockToItem[mapgen.BLOCK_COAL] = ITEM_COAL
	blockToItem[mapgen.BLOCK_IRON] = ITEM_IRON
	blockToItem[mapgen.BLOCK_GOLD] = ITEM_GOLD
	blockToItem[mapgen.BLOCK_SAPPHIRE] = ITEM_SAPPHIRE
	blockToItem[mapgen.BLOCK_EMERALD] = ITEM_EMERALD
	blockToItem[mapgen.BLOCK_RUBY] = ITEM_RUBY
	blockToItem[mapgen.BLOCK_DIAMOND] = ITEM_DIAMOND
	blockToItem[mapgen.BLOCK_POUDRETTEITE] = ITEM_POUDRETTEITE
	blockToItem[mapgen.BLOCK_GLASS] = ITEM_GLASS
	// All others are ITEM_NIL by default
}
