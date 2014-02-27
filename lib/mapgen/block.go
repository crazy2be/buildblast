package mapgen

type Block byte

const (
	BLOCK_NIL   = Block(0)
	BLOCK_AIR   = Block(1)
	BLOCK_DIRT  = Block(2)
	BLOCK_STONE = Block(3)
	BLOCK_SPAWN = Block(4)

	// See "Block encoding.txt"

	// Properties
	BLOCK_MINEABLE = 0x80000000

	// Subtypes
	// Invisible blocks are ignored by the renderer, and have no physical
	// manifestation in the world.
	BLOCK_INVISIBLE = 0x1 << 0
	// Solid blocks are treated as solid by physics simulations, and will
	// prevent entities from occupying the same space as them.
	BLOCK_SOLID = 0x1 << 1
)

var BLOCK_PROPERTIES []uint32 = []uint32{
	/** NIL    */ 0,
	/** AIR    */ BLOCK_INVISIBLE,
	/** DIRT   */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** STONE  */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** SPAWN  */ BLOCK_SOLID,
}

func (b Block) Solid() bool {
	return BLOCK_PROPERTIES[b]&BLOCK_SOLID == BLOCK_SOLID
}

func (b Block) Mineable() bool {
	return BLOCK_PROPERTIES[b]&BLOCK_MINEABLE == BLOCK_MINEABLE
}
