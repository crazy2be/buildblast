package noise

type Source2d interface {
	Noise2(x, y float64) float64
}

type Source3d interface {
	Noise3(x, y, z float64) float64
}

type Source4d interface {
	Noise4(x, y, z, w float64) float64
}
