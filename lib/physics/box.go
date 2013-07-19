package physics

import (
	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
)

// xs means x start, xe means x end, etc.
// We have a middle value for y because otherwise
// players can impale themselves on blocks (since
// players are > 1 block high). Note that this means
// this implementation is not completely generic.
// Oh well, it also means that it's really fast!
type Box struct {
	xs float64
	xe float64
	ys float64
	ym float64
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
		xs: p.X - he.X + co.X,
		xe: p.X + he.X + co.X,
		ys: p.Y - he.Y + co.Y,
		ym: p.Y + co.Y,
		ye: p.Y + he.Y + co.Y,
		zs: p.Z - he.Z + co.Z,
		ze: p.Z + he.Z + co.Z,
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
	if (b.inSolid(world)) {
		b.xs -= amount.X
		b.xe -= amount.X
		amount.X = 0
	}

	b.ys += amount.Y
	b.ym += amount.Y
	b.ye += amount.Y
	if (b.inSolid(world)) {
		b.ys -= amount.Y
		b.ym -= amount.Y
		b.ye -= amount.Y
		amount.Y = 0
	}

	b.zs += amount.Z
	b.ze += amount.Z
	if (b.inSolid(world)) {
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
	solid := func (x, y, z float64) bool {
		block := world.Block(coords.World{x, y, z}.Block())
		return block.Solid()
	}

	xs := b.xs; xe := b.xe
	ys := b.ys; ym := b.ym; ye := b.ye
	zs := b.zs; ze := b.ze

	return solid(xs, ys, zs) || solid(xs, ys, ze) ||
		   solid(xs, ym, zs) || solid(xs, ym, ze) ||
		   solid(xs, ye, zs) || solid(xs, ye, ze) ||
		   solid(xe, ys, zs) || solid(xe, ys, ze) ||
		   solid(xe, ym, zs) || solid(xe, ym, ze) ||
		   solid(xe, ye, zs) || solid(xe, ye, ze)
}
