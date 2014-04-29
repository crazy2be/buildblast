package noise

type Noise2Source interface {
	Noise(x, y float64) float64
}

type Noise3Source interface {
	Noise(x, y, z float64) float64
}

type Noise4Source interface {
	Noise(x, y, z, w float64) float64
}