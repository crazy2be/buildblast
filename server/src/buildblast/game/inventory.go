package game

import (
	"fmt"
)

type Inventory struct {
	slots     []Item
	itemLeft  int
	itemRight int
}

const (
	INV_WIDTH   = 5
	INV_HEIGHT  = 5
	MAX_STACK   = 50
)

func NewInventory() *Inventory {
	// 0 -> (w * h) - 1 are the bag slots, 2 more for left equip, and 2 more again for right.
	// [0, w*h - 1] = bag slots
	// [w*h]        = left equip
	// [w*h + 1]    = left reserve
	// [w*h + 2]    = right equip
	// [w*h + 3]    = right reserve
	inv := make([]Item, INV_WIDTH * INV_HEIGHT + 4)
	inv[0] = NewItem(ITEM_GUN)
	inv[1] = NewItem(ITEM_SHOVEL)
	inv[2] = NewItem(ITEM_DIRT)
	inv[3] = NewItem(ITEM_STONE)
	inv[INV_WIDTH * INV_HEIGHT] = NewItem(ITEM_GUN)
	inv[INV_WIDTH * INV_HEIGHT + 2] = NewItem(ITEM_SHOVEL)
	inv[INV_WIDTH * INV_HEIGHT + 3] = NewItem(ITEM_DIRT)

	return &Inventory{
		slots: inv,
		itemLeft: INV_WIDTH * INV_HEIGHT,
		itemRight: INV_WIDTH * INV_HEIGHT + 2,
	}
}

func (inv *Inventory) SetActiveItems(left, right int) {
	inv.itemLeft = left
	inv.itemRight = right
}

func (inv *Inventory) LeftItem() Item {
	return inv.slots[inv.itemLeft]
}

func (inv *Inventory) RightItem() Item {
	return inv.slots[inv.itemRight]
}

func (inv *Inventory) MoveItems(from, to int) {
	temp := inv.slots[from]
	inv.slots[from] = inv.slots[to]
	inv.slots[to] = temp
}

func (inv *Inventory) AddItem(kind byte) {
	firstOpenSpace := -1
	// Find the item
	for i, item := range inv.slots{
		if firstOpenSpace < 0 && item.kind == ITEM_NIL {
			firstOpenSpace = i
		}
		if item.kind == kind && item.num < MAX_STACK {
			inv.slots[i].num++
			return
		}
	}
	// TODO: Handle no space left
	if firstOpenSpace >= 0 {
		inv.slots[firstOpenSpace] = NewItem(kind)
	}
}

func (inv *Inventory) RemoveItem(kind byte) {
	// Find the item

	// Check your hands first
	if inv.slots[inv.itemLeft].kind == kind {
		inv.lowerStack(inv.itemLeft)
		return
	}
	if inv.slots[inv.itemRight].kind == kind {
		inv.lowerStack(inv.itemRight)
		return
	}

	for i, item := range inv.slots {
		if item.kind == kind {
			inv.lowerStack(i)
			return
		}
	}
}

func (inv *Inventory) lowerStack(i int) {
	if inv.slots[i].num == 1 {
		inv.slots[i] = NewItem(ITEM_NIL)
		return
	}
	inv.slots[i].num--
}

func (inv *Inventory) ItemsToString() string {
	data := make([]byte, len(inv.slots) * 2)
	for i := 0; i < len(data); i += 2 {
		data[i] = toStringByte(byte(inv.slots[i / 2].kind))
		data[i + 1] = toStringByte(byte(inv.slots[i / 2].num))
	}
	return string(data)
}

func toStringByte(val byte) byte {
	// 32: Space charater. Control charaters
	// are not allowed in JSON strings.
	value := val + 32
	if value >= 127 || value < 32 {
		panic(fmt.Sprintf("Attempted to encode out of range value of '%d' to item data. (It might work but we need to test it)", value))
	}
	return value
}