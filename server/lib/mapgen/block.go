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
	BLOCK_GLASS        = Block(14)

	// See "Block encoding.txt"

	// Properties
	BLOCK_UNMINEABLE = 0x80000000

	// Subtypes
	// Transparent blocks can be seen through, like glass, spawn blocks, etc.
	// We will render faces behind them.
	BLOCK_TRANSPARENT = 1 << 0
	// Invisible blocks are ignored by the renderer, and have no physical
	// manifestation in the world.
	BLOCK_INVISIBLE = (1 << 1) | BLOCK_TRANSPARENT
	// Intangible blocks are ignored by physics simulations, and will
	// allow entities to occupy the same space as them.
	BLOCK_INTANGIBLE = 1 << 2
)

// By default, blocks are visible, tangible, and mineable.
var BLOCK_PROPERTIES []uint32 = []uint32{
	/** NIL          */ BLOCK_INVISIBLE | BLOCK_INTANGIBLE | BLOCK_UNMINEABLE,
	/** AIR          */ BLOCK_INVISIBLE | BLOCK_INTANGIBLE | BLOCK_UNMINEABLE,
	/** DIRT         */ 0,
	/** STONE        */ 0,
	/** SPAWN        */ BLOCK_UNMINEABLE | BLOCK_TRANSPARENT,
	/** GRASS        */ 0,
	/** COAL         */ 0,
	/** IRON         */ 0,
	/** GOLD         */ 0,
	/** SAPPHIRE     */ 0,
	/** EMERALD      */ 0,
	/** RUBY         */ 0,
	/** DIAMOND      */ 0,
	/** POUDRETTEITE */ 0,
	/** GLASS        */ BLOCK_TRANSPARENT,
}

func (b Block) Solid() bool {
	return BLOCK_PROPERTIES[b]&BLOCK_INTANGIBLE == 0
}

func (b Block) Mineable() bool {
	return BLOCK_PROPERTIES[b]&BLOCK_UNMINEABLE == 0
}
