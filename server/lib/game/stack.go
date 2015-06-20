package game

type Stack struct {
	item Item
	num  byte
}

func NewStack(item Item) Stack {
	return NewStackOf(item, 1)
}

func NewStackOf(item Item, num byte) Stack {
	return Stack{
		item: item,
		num:  num,
	}
}
