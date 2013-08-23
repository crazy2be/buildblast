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
	BLOCK_INVISIBLE		= 0x1 << 0
	BLOCK_TANGIBLE		= 0x1 << 1
)

var BLOCK_PROPERTIES []uint32 = []uint32{
	/** NIL    */ 0,
	/** AIR    */ BLOCK_INVISIBLE,
	/** DIRT   */ BLOCK_TANGIBLE | BLOCK_MINEABLE,
	/** STONE  */ BLOCK_TANGIBLE | BLOCK_MINEABLE,
}

func (b Block) Tangible() bool {
	return BLOCK_PROPERTIES[b]&BLOCK_TANGIBLE > 0
}
