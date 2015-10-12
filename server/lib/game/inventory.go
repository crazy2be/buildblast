package game

type Inventory struct {
	slots     []Stack
	itemLeft  int
	itemRight int
}

const (
	INV_WIDTH  = 5
	INV_HEIGHT = 5
	MAX_STACK  = 50
)

func NewInventory() *Inventory {
	// 0 -> (w * h) - 1 are the bag slots, 2 more for left equip, and 2 more again for right.
	// [0, w*h - 1] = bag slots
	// [w*h]        = left equip
	// [w*h + 1]    = left reserve
	// [w*h + 2]    = right equip
	// [w*h + 3]    = right reserve
	inv := make([]Stack, INV_WIDTH*INV_HEIGHT+4)

	// Bag
	i := 0
	for item := range EveryItem() {
		// Don't give people spawn blocks...
		if item == ITEM_SPAWN {
			continue;
		}
		if item.Stackable() {
			inv[i] = NewStackOf(item, MAX_STACK)
		} else {
			inv[i] = NewStack(item)
		}
		i++
	}

	// Hands
	inv[INV_WIDTH*INV_HEIGHT] = NewStack(ITEM_GUN)
	inv[INV_WIDTH*INV_HEIGHT+2] = NewStack(ITEM_SHOVEL)
	inv[INV_WIDTH*INV_HEIGHT+3] = NewStackOf(ITEM_DIRT, MAX_STACK)

	return &Inventory{
		slots:     inv,
		itemLeft:  INV_WIDTH * INV_HEIGHT,
		itemRight: INV_WIDTH*INV_HEIGHT + 2,
	}
}

func (inv *Inventory) SetActiveItems(left, right int) {
	inv.itemLeft = left
	inv.itemRight = right
}

func (inv *Inventory) LeftItem() Item {
	return inv.slots[inv.itemLeft].item
}

func (inv *Inventory) RightItem() Item {
	return inv.slots[inv.itemRight].item
}

func (inv *Inventory) MoveItems(from, to int) {
	temp := inv.slots[from]
	inv.slots[from] = inv.slots[to]
	inv.slots[to] = temp
}

func (inv *Inventory) findItemOfKind(item Item) int {
	for i, slot := range inv.slots {
		if slot.item == item {
			return i
		}
	}
	return -1
}

// Adds an item to the inventory. Returns true if the addition was successful,
// false if there is no room remaining in the inventory.
func (inv *Inventory) AddItem(item Item) bool {
	for i := len(inv.slots) - 1; i >= 0; i-- {
		slot := inv.slots[i]
		if slot.item == item && slot.num < MAX_STACK {
			inv.slots[i].num++
			return true
		}
	}
	emptySlot := inv.findItemOfKind(ITEM_NIL)
	if emptySlot < 0 {
		return false
	}
	inv.slots[emptySlot] = NewStack(item)
	return true
}

// Removes an item from the inventory. Returns true if the removal was
// successful, false if the given item does not exist in the inventory.
func (inv *Inventory) RemoveItem(item Item) bool {
	if item == ITEM_NIL {
		return false
	}
	for i := len(inv.slots) - 1; i >= 0; i-- {
		slot := inv.slots[i]
		if slot.item == item {
			inv.lowerStack(i)
			return true
		}
	}
	return false
}

func (inv *Inventory) lowerStack(i int) {
	if inv.slots[i].num > 1 {
		inv.slots[i].num--
		return
	}
	inv.slots[i].num = 0
	inv.slots[i].item = ITEM_NIL
}

func (inv *Inventory) ItemsToByteArray() []byte {
	data := make([]byte, len(inv.slots)*2)
	for i := 0; i < len(data); i += 2 {
		data[i] = byte(inv.slots[i/2].item)
		data[i+1] = byte(inv.slots[i/2].num)
	}
	return data
}
