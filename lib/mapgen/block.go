package mapgen

type Block byte

const (
	BLOCK_NIL   = Block(0)
	BLOCK_AIR   = Block(1)
	BLOCK_DIRT  = Block(2)
	BLOCK_STONE = Block(3)

	// See "Block encoding.txt"

	// Properties
	BLOCK_MINEABLE = 0x80000000

	// Subtypes
	BLOCK_EMPTY = 0x1 << 0
	BLOCK_SOLID = 0x1 << 1
)

var BLOCK_PROPERTIES []uint32 = []uint32{
	/** NIL    */ 0,
	/** AIR    */ BLOCK_EMPTY,
	/** DIRT   */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** STONE  */ BLOCK_SOLID | BLOCK_MINEABLE,
}

func (b Block) Solid() bool {
	return BLOCK_PROPERTIES[b]&BLOCK_SOLID > 0
}
