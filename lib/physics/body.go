package physics

import (
	"buildblast/lib/coords"
)

type Body interface {
	Pos() coords.World

}
