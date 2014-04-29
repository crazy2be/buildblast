package noise

type Noise2Source interface {
	Noise2(x, y float64) float64
}

type Noise3Source interface {
	Noise3(x, y, z float64) float64
}

type Noise4Source interface {
	Noise4(x, y, z, w float64) float64
}
