package mapgen

type Block byte

const (
	BLOCK_NIL          = Block(0)
	BLOCK_AIR          = Block(1)
	BLOCK_DIRT         = Block(2)
	BLOCK_STONE        = Block(3)
	BLOCK_SPAWN        = Block(4)
	BLOCK_GRASS        = Block(5)
	BLOCK_COAL         = Block(6)
	BLOCK_IRON         = Block(7)
	BLOCK_GOLD         = Block(8)
	BLOCK_SAPPHIRE     = Block(9)
	BLOCK_EMERALD      = Block(10)
	BLOCK_RUBY         = Block(11)
	BLOCK_DIAMOND      = Block(12)
	BLOCK_POUDRETTEITE = Block(13)

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
	/** NIL          */ 0,
	/** AIR          */ BLOCK_INVISIBLE,
	/** DIRT         */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** STONE        */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** SPAWN        */ BLOCK_SOLID,
	/** Grass        */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** COAL         */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** IRON         */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** GOLD         */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** SAPPHIRE     */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** EMERALD      */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** RUBY         */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** DIAMOND      */ BLOCK_SOLID | BLOCK_MINEABLE,
	/** POUDRETTEITE */ BLOCK_SOLID | BLOCK_MINEABLE,
}

func (b Block) Solid() bool {
	return BLOCK_PROPERTIES[b]&BLOCK_SOLID == BLOCK_SOLID
}

func (b Block) Mineable() bool {
	return BLOCK_PROPERTIES[b]&BLOCK_MINEABLE == BLOCK_MINEABLE
}
