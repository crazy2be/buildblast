package physics

import (
	"math"

	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
)

// xs means x start, xe means x end, etc.
type Box struct {
	xs float64
	xe float64
	ys float64
	ye float64
	zs float64
	ze float64
}

func NewBox(position coords.World, halfExtents coords.Vec3) *Box {
	return NewBoxOffset(position, halfExtents, coords.Vec3{X: 0, Y: 0, Z: 0})
}

func NewBoxOffset(position coords.World, halfExtents coords.Vec3, centerOffset coords.Vec3) *Box {
	p := position
	he := halfExtents
	co := centerOffset
	return &Box{
		xs: p.X + co.X - he.X,
		xe: p.X + co.X + he.X,
		ys: p.Y + co.Y - he.Y,
		ye: p.Y + co.Y + he.Y,
		zs: p.Z + co.Z - he.Z,
		ze: p.Z + co.Z + he.Z,
	}
}

func (b *Box) AttemptMove(world mapgen.BlockSource, amount coords.Vec3) coords.Vec3 {
	if b.inSolid(world) {
		amount.X = 0
		amount.Y = 1
		amount.Z = 0
		return amount
	}

	b.xs += amount.X
	b.xe += amount.X
	if b.inSolid(world) {
		b.xs -= amount.X
		b.xe -= amount.X
		amount.X = 0
	}

	b.ys += amount.Y
	b.ye += amount.Y
	if b.inSolid(world) {
		b.ys -= amount.Y
		b.ye -= amount.Y
		amount.Y = 0
	}

	b.zs += amount.Z
	b.ze += amount.Z
	if b.inSolid(world) {
		b.zs -= amount.Z
		b.ze -= amount.Z
		amount.Z = 0
	}

	return amount
}

func (b *Box) Contains(position coords.World) bool {
	p := position
	return b.xs < p.X && b.xe > p.X &&
		b.ys < p.Y && b.ye > p.Y &&
		b.zs < p.Z && b.ze > p.Z
}

func (b *Box) inSolid(world mapgen.BlockSource) bool {
	blockCollide := func(x, y, z int) bool {
		return world.Block(coords.Block{x, y, z}).Solid()
	}
	f := func(n float64) int {
		return int(math.Floor(n))
	}
	xs := f(b.xs)
	xe := f(b.xe)
	ys := f(b.ys)
	ye := f(b.ye)
	zs := f(b.zs)
	ze := f(b.ze)

	for x := xs; x <= xe; x++ {
		for y := ys; y <= ye; y++ {
			for z := zs; z <= ze; z++ {
				if blockCollide(x, y, z) {
					return true;
				}
			}
		}
	}
	return false;
}
