package physics

import (
	"math"

	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
	"buildblast/lib/vmath"
)

// TODO: These should be rotatable.

// xs means x start, xe means x end, etc.
type Box struct {
	xs float64
	xe float64
	ys float64
	ye float64
	zs float64
	ze float64
}

func NewBox(pos vmath.Vec3, halfExtents vmath.Vec3) *Box {
	return NewBoxOffset(pos, halfExtents, vmath.Vec3{X: 0, Y: 0, Z: 0})
}

func NewBoxOffset(pos vmath.Vec3, halfExtents vmath.Vec3, centerOffset vmath.Vec3) *Box {
	p := pos
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

func (b *Box) AttemptMove(world mapgen.BlockSource, amount vmath.Vec3) vmath.Vec3 {
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

func (b *Box) Collides(o *Box) bool {
	return b.xe > o.xs &&
		b.xs < o.xe &&
		b.ye > o.ys &&
		b.ys < o.ye &&
		b.ze > o.zs &&
		b.zs < o.ze
}

func (b *Box) Contains(position vmath.Vec3) bool {
	p := position
	return b.xs < p.X && b.xe > p.X &&
		b.ys < p.Y && b.ye > p.Y &&
		b.zs < p.Z && b.ze > p.Z
}

func (b *Box) inSolid(world mapgen.BlockSource) bool {
	blockCollide := func(x, y, z int) bool {
		blockCoord := coords.Block{x, y, z}
		if world.Block(blockCoord).Solid() {
			blockBox := NewBox(blockCoord.Center().Vec3(), vmath.Vec3{0.5, 0.5, 0.5})
			return b.Collides(blockBox)
		}
		return false
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
					return true
				}
			}
		}
	}
	return false
}
