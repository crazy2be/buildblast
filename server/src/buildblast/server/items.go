package main

type Item byte

const (
	INV_WIDTH   = 5
	INV_HEIGHT  = 2

	ITEM_NIL    = Item(0)
	ITEM_DIRT   = Item(1)
	ITEM_STONE  = Item(2)
	ITEM_SHOVEL = Item(3)
	ITEM_GUN    = Item(4)

	// Properties
	STACKABLE = 0x1 << 0
	
)

var ITEM_PROPERTIES []uint32 = []uint32 {
	/** NIL    */ 0,
	/** DIRT   */ STACKABLE,
	/** STONE  */ STACKABLE,
	/** SHOVEL */ 0,
	/** GUN    */ 0,
}

func (i Item) Stackable() bool {
	return ITEM_PROPERTIES[i] & STACKABLE > 0
}

//func Flatten(items []Item) string {
//	iw = INV_WIDTH
//	ih = INV_HEIGHT
//	data := make([]byte, iw * ih)
//	for x := 0; x < iw; x++ {
//		for y := 0; y < ih; y++ {
//			// 32: Space charater. Control charaters
//			// are not allowed in JSON strings.
//			data[x*iw*ch + y*cw + z] = byte(c[x][y][z]) + 32
//		}
//	}
//	return string(data)
//}